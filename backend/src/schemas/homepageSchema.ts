// import mongoose, { Schema, Document } from "mongoose";

// export interface ICustomization extends Document {
//   _id: string; // HTML element id
//   sport: string;
//   title: string;
//   order: number;
//   // TODO
//   type: "1x4" | "2x2" | "2x4" | "LargeAd";
//   imageUrl: string;
//   redirectUrl: string;
// }

// const CustomizationSchema = new Schema<ICustomization>(
//   {
//     _id: { type: String, required: true }, // store HTML element ID here
//     sport: { type: String, required: true },
//     title: { type: String, required: true },
//     order: { type: Number, required: true }, // helps in sorting
//     type: {
//       type: String,
//       enum: ["1x4", "2x2", "2x4", "LargeAd"],
//       required: true,
//     },
//     imageUrl: { type: String, required: true },
//     redirectUrl: { type: String, required: true },
//   },
//   { _id: false } // prevents Mongoose from auto-generating ObjectId
// );

// export default mongoose.model<ICustomization>(
//   "Customization",
//   CustomizationSchema
// );