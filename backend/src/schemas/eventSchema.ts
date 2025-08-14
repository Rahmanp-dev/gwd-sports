import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  name: string;
  description: string;
  sport: string;
  date: Date;
  participants: mongoose.Types.ObjectId[];
  links: string[];
  images: string[];
  createdBy: mongoose.Types.ObjectId;
}

const EventSchema = new Schema<IEvent>({
  name: { type: String, required: true },
  description: String,
  sport: String,
  date: { type: Date, required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  links: [{ type: String }],
  images: [{ type: String }],
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

export default mongoose.model<IEvent>("Event", EventSchema);