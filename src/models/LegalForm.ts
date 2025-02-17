import mongoose, { Schema, Document, Connection, Model } from "mongoose";

export interface ILegalForm extends Document {
  id: string;
  name: string;
  category: string;
  description: string;
  status: string;
  price: string;
  final_price: string;
  keywords: string[];
  picture_url: string;
  template_doc_id: string;
  is_highlight: boolean;
  form_detail: any[];
  rating: string;
  total_created: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILegalCategory extends Document {
  categories: [];
  templates: [];
}

const LegalFormSchema = new Schema<ILegalForm>({
  name: { type: String, required: true },
  category: { type: String, ref: "m_categories", required: true },
  description: { type: String, required: true },
  status: { type: String, required: true },
  price: { type: String, required: false },
  final_price: { type: String, required: true },
  keywords: { type: [String], required: false },
  picture_url: { type: String, required: true },
  template_doc_id: { type: String, required: true },
  is_highlight: { type: Boolean, required: false },
}, { timestamps: true });

LegalFormSchema.virtual("id").get(function () {
  return this._id.toString();
});

LegalFormSchema.set("toJSON", { virtuals: true });

export const LegalFormModel = (connection: Connection): Model<ILegalForm> => {
  return connection.model<ILegalForm>("m_legal_forms", LegalFormSchema);
};