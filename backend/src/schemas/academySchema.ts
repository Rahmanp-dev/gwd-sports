import mongoose, { Schema, Document } from "mongoose";

export interface IAcademy extends Document {
  name: string;
  location: string;
  sportsOffered: string[];
  trainers: mongoose.Types.ObjectId[];
  students: mongoose.Types.ObjectId[];
}

const AcademySchema = new Schema<IAcademy>({
  name: { type: String, required: true },
  location: String,
  sportsOffered: [String],
  trainers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  students: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

export default mongoose.model<IAcademy>("Academy", AcademySchema);