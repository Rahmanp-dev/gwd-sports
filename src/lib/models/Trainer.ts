import mongoose, { Schema, Document } from "mongoose";

export interface IQualification {
  certification: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate?: Date;
  certificateUrl?: string;
}

export interface IExperience {
  organization: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  description: string;
}

export interface ITrainerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  academyId?: mongoose.Types.ObjectId;
  sports: string[];
  students: mongoose.Types.ObjectId[];
  specializations: string[];
  qualifications: IQualification[];
  experience: IExperience[];
  hourlyRate?: number;
  availability: {
    days: string[];
    timeSlots: {
      start: string;
      end: string;
    }[];
  };
  rating: {
    average: number;
    totalReviews: number;
  };
  joinedDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TrainerProfileSchema = new Schema<ITrainerProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  academyId: {
    type: Schema.Types.ObjectId,
    ref: "Academy",
    default: null
  },
  sports: [{
    type: String,
    required: true,
    trim: true,
    lowercase: true
  }],
  students: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  specializations: [{
    type: String,
    trim: true
  }],
  qualifications: [{
    certification: {
      type: String,
      required: true,
      trim: true
    },
    issuedBy: {
      type: String,
      required: true,
      trim: true
    },
    issuedDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date,
      default: null
    },
    certificateUrl: {
      type: String,
      validate: {
        validator: function(url: string) {
          return !url || /^https?:\/\/.+/.test(url);
        },
        message: 'Certificate URL must be valid'
      }
    }
  }],
  experience: [{
    organization: {
      type: String,
      required: true,
      trim: true
    },
    position: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      default: null
    },
    description: {
      type: String,
      required: true,
      trim: true
    }
  }],
  hourlyRate: {
    type: Number,
    min: 0
  },
  availability: {
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    timeSlots: [{
      start: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
      },
      end: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
      }
    }]
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  joinedDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
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
TrainerProfileSchema.index({ academyId: 1 });
TrainerProfileSchema.index({ sports: 1 });
TrainerProfileSchema.index({ isActive: 1 });

// Virtual for student count
TrainerProfileSchema.virtual('studentCount').get(function() {
  return this.students?.length || 0;
});

export const TrainerProfile = mongoose.models.TrainerProfile || mongoose.model<ITrainerProfile>("TrainerProfile", TrainerProfileSchema);

export default TrainerProfile;
