import mongoose, { Schema, Document, Connection, Model } from "mongoose";

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

UserInputSchema.virtual("id").get(function () {
  return this._id.toString();
});

UserInputSchema.set("toJSON", { virtuals: true });

export const UserInputModel = (connection: Connection): Model<IUserInput> => {
  return connection.model<IUserInput>("UserInput", UserInputSchema);
};