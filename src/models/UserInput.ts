import mongoose, { Schema, Document } from "mongoose";

export interface IUserInput extends Document {
  _id: mongoose.Types.ObjectId;
  documentId: string;
  templateId: string;
  clientId: number;
  InputData: Object;
  createdAt: Date;
  updatedAt: Date;
}

const UserInputSchema = new Schema<IUserInput>(
  {
    documentId: { type: String, required: true },
    templateId: { type: String, required: true },
    clientId: { type: Number, required: true },
    InputData: { type: Object, required: true },
  },
  { timestamps: true }
);

export const UserInputModel = mongoose.model<IUserInput>("UserInput", UserInputSchema);
