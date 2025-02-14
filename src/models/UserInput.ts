import mongoose, { Schema, Document, Connection, Model } from "mongoose";

export interface IUserInput extends Document {
  id: string;
  document_id: number;
  input: any[];
  createdAt: Date;
  updatedAt: Date;
}

const UserInputSchema = new Schema<IUserInput>(
  {
    document_id: { type: Number, required: true },
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