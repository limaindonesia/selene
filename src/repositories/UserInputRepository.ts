import { UserInputModel, IUserInput } from "../models/UserInput";
import { connectDB2 } from "../config/mongoConfig";
import { Model } from "mongoose";

export class UserInputRepository {
  private async getModel(): Promise<Model<IUserInput>> {
    const connection = await connectDB2();
    return UserInputModel(connection);
  }

  async findAll(): Promise<IUserInput[]> {
    const model = await this.getModel();
    return model.find();
  }

  async findById(id: string): Promise<IUserInput | null> {
    const model = await this.getModel();
    return model.findById(id);
  }

  async create(data: Partial<IUserInput>): Promise<IUserInput> {
    const model = await this.getModel();
    const input = new model(data);
    return input.save();
  }

  async update(id: string, data: Partial<IUserInput>): Promise<IUserInput | null> {
    const model = await this.getModel();
    return model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<IUserInput | null> {
    const model = await this.getModel();
    return model.findByIdAndDelete(id);
  }

  async updateByDocumentId(documentId: number, data: Partial<IUserInput>): Promise<IUserInput | null> {
    const model = await this.getModel();
    return model.findOneAndUpdate(
      { document_id: documentId }, 
      data, 
      { new: true }
    );
  }
  async findOneByDocumentId(documentId: number): Promise<IUserInput | null> {
    const model = await this.getModel();
    return model.findOne({ document_id: documentId });
  }
}
