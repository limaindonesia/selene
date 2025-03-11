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

  async findAllByHighlight(): Promise<ILegalForm[]> {
    const model = await this.getModel();
    return await model.find({ status: 'SHOW', is_highlight: true }).exec();
  }

  async findAllWithPagination(
    page: number,
    limit: number,
    keyword?: string,
    category?: string[],
  ): Promise<{ total_items: number; current_page: number; data: ILegalForm[] }> {
    
    const current_page = page;

    const model = await this.getModel();

    const filter: any = {};
    
    filter.status = 'SHOW';

    if (keyword) {
      filter.name = { $regex: keyword, $options: "i" }; 
    }

    if (category) {
      filter.category = { $in: category};
    }

    const total_items = await model.countDocuments(filter);
    
    const data = await model
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      total_items,
      current_page,
      data,
    };
  }

  async findAllByCategory(category: string): Promise<ILegalForm[]> {
    const model = await this.getModel();
    return model.find({ category });
  }

  async countByCategory(): Promise<{ category: string; count: number }[]> {
    const model = await this.getModel();
    return await model.aggregate([
      { $match: { status: "SHOW" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { category: "$_id", count: 1, _id: 0 } },
    ]);
  }

  async findByFilters(
    keyword?: string,
    category?: string[],
    limit?: number
  ): Promise<ILegalForm[]> {
    const model = await this.getModel();
    const filter: any = {};
    
    filter.status = 'SHOW';

    if (keyword) {
      filter.name = { $regex: keyword, $options: "i" }; 
    }

    if (category) {
      filter.category = { $in: category};
    }

    const queryLimit = limit ?? 10;

    return model.find(filter).limit(queryLimit).exec();
  }
}
