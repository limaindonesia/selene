import mongoose, { Schema, Document, Connection, Model } from "mongoose";
import { formatToRupiah } from "../utils/utils";

export interface ILegalForm extends Document {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  status: string;
  price: number;
  final_price: number;
  keywords: string[];
  picture_url: string;
  template_doc_id: string;
  is_highlight: boolean;
  form_detail: FormDetail[];
  rating: string;
  total_created: number;
  formatted_price: string;
  formatted_final_price: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  no: number;
  element_type: string;
  details_basic: {
    question: string;
    type: string;
    placeholder: string;
    formatting_type: string;
    is_mandatory: boolean;
    hint: string;
  };
  details_advance?: any
}

export interface FormDetail {
  step: number;
  questions: Question[];
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
  price: { type: Number, required: false },
  final_price: { type: Number, required: true },
  keywords: { type: [String], required: false },
  picture_url: { type: String, required: true },
  template_doc_id: { type: String, required: true },
  is_highlight: { type: Boolean, required: false },
  form_detail: { type: [], required: false },
}, { timestamps: true });

LegalFormSchema.virtual("id").get(function () {
  return this._id.toString();
});

LegalFormSchema.virtual("formatted_price").get(function () {
  return formatToRupiah(this.price);
});

LegalFormSchema.virtual("formatted_final_price").get(function () {
  return formatToRupiah(this.final_price);
});

LegalFormSchema.set("toJSON", { virtuals: true });
LegalFormSchema.set("toObject", { virtuals: true });


export const LegalFormModel = (connection: Connection): Model<ILegalForm> => {
  return connection.model<ILegalForm>("m_legal_forms", LegalFormSchema);
};