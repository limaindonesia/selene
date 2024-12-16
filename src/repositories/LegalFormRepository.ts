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

  public async getHome(): Promise<ILegalCategory[]> {
    const model = await this.getModel();

    const groupedCategories = await model.aggregate([
      {
        $group: {
          _id: "$category",
          total: { $count: {} }
        }
      },
      {
        $project: {
          category: "$_id",
          total: 1,
          _id: 0
        }
      }
    ]);

    return groupedCategories;
  }
}
