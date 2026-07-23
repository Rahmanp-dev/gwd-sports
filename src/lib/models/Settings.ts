import mongoose, { Document, Schema } from 'mongoose';

export interface IGlobalSettings extends Document {
  performanceMetrics: string[];
  defaultFeeAmount: number;
  currency: string;
  heroMode?: 'video' | 'carousel';
  heroImages?: string[];
  logoUrl?: string;
  logoAlignment?: 'top_left' | 'middle';
  logoIsCircular?: boolean;
  logoScale?: number;
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
    },
    heroMode: {
      type: String,
      enum: ['video', 'carousel'],
      default: 'video'
    },
    heroImages: {
      type: [String],
      default: []
    },
    logoUrl: {
      type: String,
      default: ''
    },
    logoAlignment: {
      type: String,
      enum: ['top_left', 'middle'],
      default: 'top_left'
    },
    logoIsCircular: {
      type: Boolean,
      default: false
    },
    logoScale: {
      type: Number,
      default: 100
    }
  },
  { timestamps: true }
);

export const GlobalSettings = mongoose.models.GlobalSettings || mongoose.model<IGlobalSettings>('GlobalSettings', globalSettingsSchema);

export default GlobalSettings;
