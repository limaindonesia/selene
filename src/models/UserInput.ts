import mongoose, { Schema, Document, Connection, Model } from "mongoose";

export interface IUserInput extends Document {
  _id: mongoose.Types.ObjectId;
  user_document_id: string;
  input: any[];
  createdAt: Date;
  updatedAt: Date;
}

const UserInputSchema = new Schema<IUserInput>(
  {
    user_document_id: { type: String, required: true },
    input: { type: [], required: true },
  },
  { timestamps: true }
);

UserInputSchema.virtual("id").get(function () {
  return this._id.toString();
});

UserInputSchema.set("toJSON", { virtuals: true });

export const UserInputModel = (connection: Connection): Model<IUserInput> => {
  return connection.model<IUserInput>("m_user_inputs", UserInputSchema);
};