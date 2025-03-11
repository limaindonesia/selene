import mongoose, { Schema, Document, Connection, Model } from "mongoose";

export interface IUserInput extends Document {
  id: string;
  document_id: number;
  input: UserInput[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInput {
  no: number;
  answer?: string;
  answers?: AdvanceAnswer[];
}

interface AdvanceAnswer {
  no: number;
  variable: {
    [key: string]: string;
  };
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