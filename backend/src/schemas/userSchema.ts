import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "admin" | "trainer" | "student" | "user";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  sports?: string[]; // sports they are associated with
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8 },
  phone: { type: String, required: true },
  role: { type: String, enum: ["admin", "trainer", "student", "user"], default: "user" },
  sports: [String],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>("User", UserSchema);