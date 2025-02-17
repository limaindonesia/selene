import { CategoryModel, ICategory } from "../models/Category";
import { connectDB2 } from "../config/mongoConfig";
import { Model } from "mongoose";

export class CategoryRepository {
  private async getModel(): Promise<Model<ICategory>> {
    const connection = await connectDB2();
    return CategoryModel(connection);
  }

  async findAll(): Promise<ICategory[]> {
    const model = await this.getModel();
    return model.find();
  }

  async findById(id: string): Promise<ICategory | null> {
    const model = await this.getModel();
    return model.findById(id);
  }
  
  async findByStringId(stringId: string): Promise<ICategory | null> {
    const model = await this.getModel();
    return model.findOne({ string_id: stringId });
  }

  async findByName(name: string): Promise<ICategory | null> {
    const model = await this.getModel();
    return model.findOne({ name: name });
  }

  async findByNames(names: string[]): Promise<ICategory[] | null> {
    const model = await this.getModel();
    return model.find( { name : { $in : names } } );
  }

  async create(data: Partial<ICategory>): Promise<ICategory> {
    const model = await this.getModel();
    const category = new model(data);
    return category.save();
  }

  async update(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    const model = await this.getModel();
    return model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<ICategory | null> {
    const model = await this.getModel();
    return model.findByIdAndDelete(id);
  }
}
