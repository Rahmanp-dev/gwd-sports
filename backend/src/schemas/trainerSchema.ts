import mongoose, { Schema, Document } from "mongoose";

export interface ITrainerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  sports: string[];
  students: mongoose.Types.ObjectId[];
}

const TrainerProfileSchema = new Schema<ITrainerProfile>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  sports: [String],
  students: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

export default mongoose.model<ITrainerProfile>("TrainerProfile", TrainerProfileSchema);