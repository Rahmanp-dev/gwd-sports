import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "admin" | "trainer" | "student" | "user" | "gwd_super_admin";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; 
  role: UserRole;
  phone?: string;
  sports?: string[];
  academyId?: mongoose.Types.ObjectId;
  refreshTokens?: string[];
  isActive: boolean;
  /**
   * True for accounts created by bulk import from a paper register.
   *
   * Such a student has no email address and no password — the schema requires
   * both, so a synthetic address on a domain we control is generated and the
   * password is random and never disclosed. The account exists solely to satisfy
   * the StudentProfile → User reference; the parent interacts with the platform
   * through their Passport link and phone-based OTP, never through this login.
   *
   * Login, forgot-password and email flows MUST skip these accounts: a password
   * reset would be sent to an unroutable address, and treating one as a real
   * account misleads support into thinking the parent has credentials.
   */
  /** The email is synthetic and cannot receive mail. Gates email-based recovery. */
  isImportedPlaceholder?: boolean;
  /**
   * Signed in with a password the academy issued at import rather than one the
   * parent chose. Prompts a change on first login.
   */
  mustChangePassword?: boolean;
  lastLogin?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  __v?: number; 
  comparePassword(candidatePassword: string): Promise<boolean>;
  addRefreshToken(token: string): Promise<void>;
  removeRefreshToken(token: string): Promise<void>;
}

const UserSchema = new Schema<IUser>({
  name: { 
    type: String, 
    required: [true, 'Name is required'], 
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'], 
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  phone: { 
    type: String, 
    required: [true, 'Phone number is required'],
    match: [/^[+]?[\d\s\-\(\)]{10,}$/, 'Please enter a valid phone number']
  },
  role: { 
    type: String, 
    enum: {
      values: ["admin", "trainer", "student", "user", "gwd_super_admin"],
      message: '{VALUE} is not a valid role'
    }, 
    default: "user" 
  },
  academyId: {
    type: Schema.Types.ObjectId,
    ref: "Academy",
    default: null
  },
  sports: [{
    type: String,
    trim: true
  }],
  refreshTokens: [{
    type: String,
    select: false
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isImportedPlaceholder: {
    type: Boolean,
    default: false
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password as string);
};

// Method to add refresh token
/**
 * Atomic `$push` for the same reason as removeRefreshToken below: this runs on
 * every login, and a `save()` here means one legacy field anywhere on the user
 * document locks that person out entirely with a 500.
 */
UserSchema.methods.addRefreshToken = async function(token: string): Promise<void> {
  await (this.constructor as mongoose.Model<IUser>).updateOne(
    { _id: this._id },
    { $push: { refreshTokens: token } }
  );
  this.refreshTokens = this.refreshTokens || [];
  this.refreshTokens.push(token);
};

// Method to remove refresh token
/**
 * Atomic `$pull`, NOT `filter()` + `save()`.
 *
 * `save()` revalidates the ENTIRE document. Any legacy value anywhere on a user
 * written before a validator existed therefore made logout throw a 500, even
 * though revoking a token has nothing to do with the offending field. This is
 * the same failure that took student imports down via `timings.workingDays`.
 *
 * `updateOne` touches one array and skips document validation, so signing out
 * cannot be blocked by unrelated legacy data.
 */
UserSchema.methods.removeRefreshToken = async function(token: string): Promise<void> {
  await (this.constructor as mongoose.Model<IUser>).updateOne(
    { _id: this._id },
    { $pull: { refreshTokens: token } }
  );
  this.refreshTokens = this.refreshTokens?.filter((t: string) => t !== token) || [];
};

// Performance index for multi-tenant queries
UserSchema.index({ academyId: 1 });
UserSchema.index({ role: 1, academyId: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
