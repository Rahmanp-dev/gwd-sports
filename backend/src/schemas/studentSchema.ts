import mongoose, { Schema, Document } from "mongoose";

export interface IStudentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  academyId: mongoose.Types.ObjectId;
  feesPaid: number;
  attendance: { date: Date; present: boolean }[];
  kits: { kitName: string; status: "delivered" | "requested" }[];
  performance: { sport: string; score: number; remarks: string }[];
}

const StudentProfileSchema = new Schema<IStudentProfile>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  academyId: { type: Schema.Types.ObjectId, ref: "Academy" },
  feesPaid: { type: Number, default: 0 },
  attendance: [
    {
      date: { type: Date, required: true },
      present: { type: Boolean, required: true },
    },
  ],
  kits: [
    {
      kitName: String,
      status: { type: String, enum: ["delivered", "requested"], default: "requested" },
    },
  ],
  performance: [
    {
      sport: String,
      score: Number,
      remarks: String,
    },
  ],
});

export default mongoose.model<IStudentProfile>("StudentProfile", StudentProfileSchema);