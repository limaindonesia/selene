import { LegalFormRatingModel, ILegalFormRating } from "../models/LegalFormRating";
import { connectDB2 } from "../config/mongoConfig";

export class UserInputRepository {
  private async getModel() {
    const connection = await connectDB2();
    return LegalFormRatingModel(connection);
  }

  async findAll(): Promise<ILegalFormRating[]> {
    const model = await this.getModel();
    return await model.find();
  }

  async findById(id: string): Promise<ILegalFormRating | null> {
    const model = await this.getModel();
    return await model.findById(id);
  }

  async create(data: Partial<ILegalFormRating>): Promise<ILegalFormRating> {
    const model = await this.getModel();
    const form = new model(data);
    return await form.save();
  }

  async update(id: string, data: Partial<ILegalFormRating>): Promise<ILegalFormRating | null> {
    const model = await this.getModel();
    return await model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<ILegalFormRating | null> {
    const model = await this.getModel();
    return await model.findByIdAndDelete(id);
  }
}
