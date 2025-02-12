import mongoose, { Schema, Document, Connection, Model } from "mongoose";

export interface ILegalFormTemplate extends Document {
  id: string;
  template: string;
  file: any[];
  createdAt: Date;
  updatedAt: Date;
}


const LegalFormTemplateSchema = new Schema<ILegalFormTemplate>({
  template: { type: String, required: true },
}, { timestamps: true });

LegalFormTemplateSchema.virtual("id").get(function () {
  return this._id.toString();
});

LegalFormTemplateSchema.set("toJSON", { virtuals: true });

export const LegalFormTemplateModel = (connection: Connection): Model<ILegalFormTemplate> => {
  return connection.model<ILegalFormTemplate>("m_legal_form_templates", LegalFormTemplateSchema);
};