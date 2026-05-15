import mongoose, { Document, Schema } from 'mongoose';

export interface IGlobalSettings extends Document {
  performanceMetrics: string[];
  defaultFeeAmount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const globalSettingsSchema = new Schema<IGlobalSettings>(
  {
    performanceMetrics: {
      type: [String],
      default: ["dribble", "running", "defending", "strike", "stamina"],
    },
    defaultFeeAmount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    }
  },
  { timestamps: true }
);

export const GlobalSettings = mongoose.model<IGlobalSettings>('GlobalSettings', globalSettingsSchema);
