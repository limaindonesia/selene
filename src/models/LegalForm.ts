import mongoose, { Schema, Document, Connection, Model } from "mongoose";
import { DocumentStatus } from "../enums/documentStatus.enum";

export interface ILegalForm extends Document {
  id: string;
  name: string;
  category: string;
  description: string;
  status: string;
  price: number;
  keywords: string[];
  picture_url: string;
  template_doc_id: string;
  form_detail: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ILegalCategory extends Document {
  categories: [];
  templates: [];
}

const LegalFormSchema = new Schema<ILegalForm>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, required: true },
  price: { type: Number, required: true },
  keywords: { type: [String], required: true },
  picture_url: { type: String, required: true },
  template_doc_id: { type: String, required: true },
}, { timestamps: true });

LegalFormSchema.virtual("id").get(function () {
  return this._id.toString();
});

LegalFormSchema.set("toJSON", { virtuals: true });

export const LegalFormModel = (connection: Connection): Model<ILegalForm> => {
  return connection.model<ILegalForm>("m_legal_forms", LegalFormSchema);
};