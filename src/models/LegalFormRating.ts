import mongoose, { Schema, Document, Connection, Model } from "mongoose";

export interface ILegalFormRating extends Document {
  id: string;
  legal_form_id: string;
  document_id: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const LegalFormRatingSchema = new Schema<ILegalFormRating>({
    legal_form_id: { type: String, required: true },
    document_id: { type: String, required: true },
    rating: { type: Number, required: true },
}, { timestamps: true });

LegalFormRatingSchema.virtual("id").get(function () {
  return this._id.toString();
});

LegalFormRatingSchema.set("toJSON", { virtuals: true });

export const LegalFormRatingModel = (connection: Connection): Model<ILegalFormRating> => {
  return connection.model<ILegalFormRating>("m_legal_form_ratings", LegalFormRatingSchema);
};