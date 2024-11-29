import mongoose, { Schema, Document, Connection, Model } from "mongoose";
import { DocumentStatus } from "../enums/documentStatus.enum";

export interface ILegalForm extends Document {
  id: string;
  title: string;
  content: string;
  clientId: number;
  category: string;
  status: DocumentStatus;
  documentUrl: string,
  createdAt: Date;
  updatedAt: Date;
}

const LegalFormSchema = new Schema<ILegalForm>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true }
  },
  { timestamps: true }
);

LegalFormSchema.virtual("id").get(function () {
  return this._id.toString();
});

LegalFormSchema.set("toJSON", { virtuals: true });

export const LegalFormModel = (connection: Connection): Model<ILegalForm> => {
  return connection.model<ILegalForm>("LegalForm", LegalFormSchema);
};