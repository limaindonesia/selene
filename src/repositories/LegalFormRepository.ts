import { LegalFormModel, ILegalForm, ILegalCategory } from "../models/LegalForm";
import { connectDB1 } from "../config/mongoConfig";

export class LegalFormRepository {
  private async getModel() {
    const connection = await connectDB1();
    return LegalFormModel(connection);
  }

  async findAll(): Promise<ILegalForm[]> {
    const model = await this.getModel();
    return await model.find();
  }

  async findById(id: string): Promise<ILegalForm | null> {
    const model = await this.getModel();
    return await model.findById(id);
  }

  async create(data: Partial<ILegalForm>): Promise<ILegalForm> {
    const model = await this.getModel();
    const form = new model(data);
    return await form.save();
  }

  async update(id: string, data: Partial<ILegalForm>): Promise<ILegalForm | null> {
    const model = await this.getModel();
    return await model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<ILegalForm | null> {
    const model = await this.getModel();
    return await model.findByIdAndDelete(id);
  }

  async findAllByStatus(status: string): Promise<ILegalForm[]> {
    const model = await this.getModel();
    return await model.find({ status }).exec();
  }

  async countByCategory(): Promise<{ category: string; count: number }[]> {
    const model = await this.getModel();
    return await model.aggregate([
      { $match: { status: "SHOW" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { category: "$_id", count: 1, _id: 0 } },
    ]);
  }
}
