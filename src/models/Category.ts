import mongoose, { Schema, Document, Connection, Model } from "mongoose";

export interface ICategory extends Document {
  id: string;
  string_id: string;
  name: string;
  icon_url: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  string_id: { type: String, required: true },
  description: { type: String, required: true },
  icon_url: { type: String, required: false },
}, { timestamps: true });

CategorySchema.virtual("id").get(function () {
  return this._id.toString();
});

CategorySchema.set("toJSON", { virtuals: true });

export const CategoryModel = (connection: Connection): Model<ICategory> => {
  return connection.model<ICategory>("m_categories", CategorySchema);
};