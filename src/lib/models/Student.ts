import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAttendance {
  date: Date;
  present: boolean;
  markedBy: mongoose.Types.ObjectId;
  remarks?: string;
}

export interface IKit {
  kitName: string;
  status: "delivered" | "requested" | "processing" | "rejected";
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
  trainers: mongoose.Types.ObjectId[];
  enrollmentDate?: Date;

  /**
   * Link to the student's global Passport. The Passport is the permanent
   * identity; this profile is the academy-scoped enrolment record. One passport
   * may point at a series of these over time as the student moves academies.
   */
  passportId?: string;

  /**
   * PARENT IDENTITY.
   *
   * The system previously had no parent concept at all — a parent's number lived
   * only on the student's own User record or buried in medicalInfo's emergency
   * contact. Every parent-facing feature needs this: WhatsApp messaging, the QR
   * check-in that resolves "which of my children are in this batch", and
   * duplicate detection at import.
   *
   * parentPhoneE164 is the normalised lookup key (see src/lib/phone.ts) and is
   * indexed. parentPhone keeps whatever the owner originally typed, for display
   * and for resolving disputes about what was entered.
   */
  parentName?: string;
  parentPhone?: string;
  parentPhoneE164?: string;

  /** The batch this student trains in. Phase 3 attendance is per batch session. */
  batchId?: mongoose.Types.ObjectId;

  /** Provenance: which bulk import created this record, if any. */
  importJobId?: mongoose.Types.ObjectId;
  feePayments: IFeePayment[];
  totalFeesPaid: number;
  outstandingFees: number;

  /**
   * The fee for THIS student, in rupees, per `feePeriod`. Academies commonly
   * charge different students different amounts (siblings, scholarships,
   * legacy rates), so a single academy-wide figure is not sufficient.
   * When unset, the academy's published fee schedule applies.
   */
  feeAmount?: number;
  feePeriod?: 'monthly' | 'quarterly' | 'halfYearly' | 'yearly';
  /** Day of month the fee falls due. Drives Phase 2's reminder cadence. */
  feeDueDayOfMonth?: number;
  attendance: IAttendance[];
  kits: Types.DocumentArray<IKit>;
  performance: IPerformance[];
  sports: string[];
  level: "beginner" | "intermediate" | "advanced" | "U12" | "U14" | "U16" | "U19" | "U23";
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
  trainers: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  enrollmentDate: {
    type: Date,
    default: null
  },
  passportId: {
    type: String,
    trim: true,
    uppercase: true
  },
  parentName: {
    type: String,
    trim: true
  },
  parentPhone: {
    type: String,
    trim: true
  },
  parentPhoneE164: {
    type: String,
    trim: true
  },
  batchId: {
    type: Schema.Types.ObjectId,
    ref: "Batch"
  },
  importJobId: {
    type: Schema.Types.ObjectId,
    ref: "ImportJob"
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
  feeAmount: {
    type: Number,
    min: 0
  },
  feePeriod: {
    type: String,
    enum: ["monthly", "quarterly", "halfYearly", "yearly"],
    default: "monthly"
  },
  feeDueDayOfMonth: {
    type: Number,
    min: 1,
    max: 28, // Capped at 28 so every month has the day — no Feb 30th problem.
    default: 5
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
      enum: ["delivered", "requested", "processing", "rejected"],
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
    enum: ["beginner", "intermediate", "advanced", "U12", "U14", "U16", "U19", "U23"],
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
StudentProfileSchema.index({ academyId: 1 });
StudentProfileSchema.index({ trainers: 1 });
StudentProfileSchema.index({ isActive: 1 });
StudentProfileSchema.index({ passportId: 1 });
// The QR check-in lookup: a parent's children within one academy/batch.
StudentProfileSchema.index({ academyId: 1, parentPhoneE164: 1 });
StudentProfileSchema.index({ batchId: 1, isActive: 1 });
// Duplicate-phone detection during import.
StudentProfileSchema.index({ parentPhoneE164: 1 });

export const StudentProfile = mongoose.models.StudentProfile || mongoose.model<IStudentProfile>("StudentProfile", StudentProfileSchema);

export default StudentProfile;
