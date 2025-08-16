import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAttendance {
  date: Date;
  present: boolean;
  markedBy: mongoose.Types.ObjectId;
  remarks?: string;
}

export interface IKit {
  kitName: string;
  status: "delivered" | "requested" | "processing";
  requestedAt: Date;
  deliveredAt?: Date;
  cost?: number;
}

export interface IPerformance {
  sport: string;
  score: number;
  maxScore: number;
  remarks: string;
  evaluatedBy: mongoose.Types.ObjectId;
  evaluatedAt: Date;
  category: string; // e.g., "fitness", "technique", "game"
}

export interface IFeePayment {
  amount: number;
  paymentDate: Date;
  period: "monthly" | "quarterly" | "yearly";
  status: "paid" | "pending" | "overdue";
  transactionId?: string;
}

export interface IStudentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  academyId?: mongoose.Types.ObjectId;
  trainerId?: mongoose.Types.ObjectId;
  enrollmentDate?: Date;
  feePayments: IFeePayment[];
  totalFeesPaid: number;
  outstandingFees: number;
  attendance: IAttendance[];
  kits: Types.DocumentArray<IKit>;
  performance: IPerformance[];
  sports: string[];
  level: "beginner" | "intermediate" | "advanced";
  medicalInfo?: {
    allergies?: string[];
    medications?: string[];
    emergencyContact: {
      name: string;
      phone: string;
      relation: string;
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>({
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
  trainerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  enrollmentDate: {
    type: Date,
    default: null
  },
  feePayments: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentDate: {
      type: Date,
      required: true
    },
    period: {
      type: String,
      enum: ["monthly", "quarterly", "yearly"],
      required: true
    },
    status: {
      type: String,
      enum: ["paid", "pending", "overdue"],
      default: "pending"
    },
    transactionId: {
      type: String,
      trim: true
    }
  }],
  totalFeesPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  outstandingFees: {
    type: Number,
    default: 0,
    min: 0
  },
  attendance: [{
    date: {
      type: Date,
      required: true
    },
    present: {
      type: Boolean,
      required: true
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    remarks: {
      type: String,
      trim: true
    }
  }],
  kits: [{
    kitName: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["delivered", "requested", "processing"],
      default: "requested"
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    cost: {
      type: Number,
      min: 0
    }
  }],
  performance: [{
    sport: {
      type: String,
      required: true,
      trim: true
    },
    score: {
      type: Number,
      required: true,
      min: 0
    },
    maxScore: {
      type: Number,
      required: true,
      min: 1
    },
    remarks: {
      type: String,
      required: true,
      trim: true
    },
    evaluatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    evaluatedAt: {
      type: Date,
      default: Date.now
    },
    category: {
      type: String,
      required: true,
      trim: true
    }
  }],
  sports: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  level: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner"
  },
  medicalInfo: {
    allergies: [{
      type: String,
      trim: true
    }],
    medications: [{
      type: String,
      trim: true
    }],
    emergencyContact: {
      name: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        match: [/^[+]?[\d\s\-\(\)]{10,}$/, 'Please enter a valid phone number']
      },
      relation: {
        type: String,
        trim: true
      }
    }
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
StudentProfileSchema.index({ userId: 1 });
StudentProfileSchema.index({ academyId: 1 });
StudentProfileSchema.index({ trainerId: 1 });
StudentProfileSchema.index({ isActive: 1 });

export default mongoose.model<IStudentProfile>("StudentProfile", StudentProfileSchema);