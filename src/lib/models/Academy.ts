import mongoose, { Schema, Document } from "mongoose";

export interface IAcademy extends Document {
  name: string;
  description: string;
  location: string;
  address: string;
  sports: string[];
  trainers: mongoose.Types.ObjectId[];
  students: mongoose.Types.ObjectId[];
  fees: {
    monthly: number;
    quarterly: number;
    halfYearly: number;
    yearly: number;
  };
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
  facilities: string[];
  timings: {
    opening: string;
    closing: string;
    workingDays: string[];
  };
  capacity: number;
  images: string[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  slug: string;
  rzp_account?: string;
  theme: {
    primaryColor: string;
    accentColor: string;
    logoUrl: string;
    heroImages: string[];
    tagline: string;
  };
  platformFeePercent: number;
  createdAt: Date;
  updatedAt: Date;
}

const AcademySchema = new Schema<IAcademy>({
  name: {
    type: String,
    required: [true, 'Academy name is required'],
    trim: true,
    minlength: [3, 'Academy name must be at least 3 characters'],
    maxlength: [100, 'Academy name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  sports: [{
    type: String,
    required: true,
    trim: true,
    lowercase: true
  }],
  trainers: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }], 
  students: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  fees: {
    monthly: {
      type: Number,
      required: true,
      min: [0, 'Monthly fee cannot be negative']
    },
    quarterly: {
      type: Number,
      required: true,
      min: [0, 'Quarterly fee cannot be negative']
    },
    halfYearly: {
      type: Number,
      required: true,
      min: [0, 'Half-yearly fee cannot be negative'],
      default: 0
    },
    yearly: {
      type: Number,
      required: true,
      min: [0, 'Yearly fee cannot be negative']
    }
  },
  contactInfo: {
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Contact phone is required'],
      match: [/^[+]?[\d\s\-\(\)]{10,}$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }
  },
  facilities: [{
    type: String,
    trim: true
  }],
  timings: {
    opening: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
    },
    closing: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
    },
    workingDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  capacity: {
    type: Number,
    required: true,
    min: [1, 'Capacity must be at least 1']
  },
  images: [{
    type: String,
    validate: {
      validator: function(url: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      },
      message: 'Images must be valid image URLs'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  slug: {
    type: String,
    required: [true, 'Academy slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  rzp_account: {
    type: String
  },
  theme: {
    primaryColor: { type: String, default: '#7c3aed' },
    accentColor: { type: String, default: '#c8971a' },
    logoUrl: { type: String, default: '' },
    heroImages: [{ type: String }],
    tagline: { type: String, default: '' }
  },
  platformFeePercent: {
    type: Number,
    default: 1,
    min: 0,
    max: 10
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret: any) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
AcademySchema.index({ ownerId: 1 });
AcademySchema.index({ location: 1, sports: 1 });
AcademySchema.index({ isActive: 1 });
AcademySchema.index({ createdBy: 1 });

// Virtual for student count
AcademySchema.virtual('studentCount').get(function() {
  return this.students?.length || 0;
});

// Virtual for trainer count
AcademySchema.virtual('trainerCount').get(function() {
  return this.trainers?.length || 0;
});

export const Academy = mongoose.models.Academy || mongoose.model<IAcademy>("Academy", AcademySchema);

export default Academy;
