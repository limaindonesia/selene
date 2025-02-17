import mongoose, { Schema, Document, Connection, Model } from "mongoose";

export interface IUserDocument extends Document {
  id: string;
  document_id: number;
  legal_form_id: string;
  client_id: string;
  status: number;
  is_client_rated: boolean;
  document_rating: number;
  generated_at: Date;
  file: any[];
  createdAt: Date;
  updatedAt: Date;
}

const UserDocumentSchema = new Schema<IUserDocument>({
  document_id: { type: Number, required: true, unique: true},
  legal_form_id: { type: String, required: true },
  client_id: { type: String, required: true },
  status: { type: Number, required: true },
  is_client_rated: { type: Boolean, required: false },
  document_rating: { type: Number, required: false },
  generated_at: { type: Date, required: false },
}, { timestamps: true });

UserDocumentSchema.virtual("id").get(function () {
  return this._id.toString();
});

UserDocumentSchema.set("toJSON", { virtuals: true });

export const UserDocumentModel = (connection: Connection): Model<IUserDocument> => {
  return connection.model<IUserDocument>("m_user_documents", UserDocumentSchema);
};