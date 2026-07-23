import mongoose, { Schema, Document } from "mongoose";

export interface ILandingPageEventCard extends Document {
  eventId: mongoose.Types.ObjectId;
  order: number;
  colorScheme: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LandingPageEventCardSchema = new Schema<ILandingPageEventCard>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
      unique: true,
    },
    order: {
      type: Number,
      required: [true, "Order is required"],
      min: [1, "Order must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Order must be a whole number",
      },
    },
    colorScheme: {
      type: String,
      required: true,
      enum: [
        "from-green-600 to-emerald-500",
        "from-orange-600 to-red-500",
        "from-blue-600 to-cyan-500",
        "from-purple-600 to-violet-500",
        "from-pink-600 to-rose-500",
        "from-yellow-600 to-amber-500",
        "from-indigo-600 to-blue-500",
        "from-red-600 to-pink-500",
      ],
      default: "from-green-600 to-emerald-500",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
LandingPageEventCardSchema.index({ order: 1 });
LandingPageEventCardSchema.index({ isActive: 1, order: 1 });

export const LandingPageEventCard = mongoose.models.LandingPageEventCard || mongoose.model<ILandingPageEventCard>(
  "LandingPageEventCard",
  LandingPageEventCardSchema
);

export default LandingPageEventCard;
