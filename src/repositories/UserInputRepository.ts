import { UserInputModel, IUserInput } from "../models/UserInput";
import { connectDB2 } from "../config/mongoConfig";

export class UserInputRepository {
  private async getModel() {
    const connection = await connectDB2();
    return UserInputModel(connection);
  }

  async findAll(): Promise<IUserInput[]> {
    const model = await this.getModel();
    return await model.find();
  }

  async findById(id: string): Promise<IUserInput | null> {
    const model = await this.getModel();
    return await model.findById(id);
  }

  async create(data: Partial<IUserInput>): Promise<IUserInput> {
    const model = await this.getModel();
    const form = new model(data);
    return await form.save();
  }

  async update(id: string, data: Partial<IUserInput>): Promise<IUserInput | null> {
    const model = await this.getModel();
    return await model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<IUserInput | null> {
    const model = await this.getModel();
    return await model.findByIdAndDelete(id);
  }
}
