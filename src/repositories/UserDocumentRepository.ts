import { UserDocumentModel, IUserDocument } from "../models/UserDocument";
import { connectDB2 } from "../config/mongoConfig";

export class UserDocumentRepository {
  private async getModel() {
    const connection = await connectDB2();
    return UserDocumentModel(connection);
  }

  async findAllWithPagination(
    page: number,
    pageSize: number,
    status?: number[]
  ): Promise<{ totalItems: number; totalPages: number; data: IUserDocument[] }> {
    const model = await this.getModel();
    const query = status?.length ? { status: { $in: status } } : {};
    
    const totalItems = await model.countDocuments(query);
    const totalPages = Math.ceil(totalItems / pageSize);
    const data = await model
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return {
      totalItems,
      totalPages,
      data,
    };
  }

  async findById(id: string): Promise<IUserDocument | null> {
    const model = await this.getModel();
    return model.findById(id);
  }

  async create(data: Partial<IUserDocument>): Promise<IUserDocument> {
    const model = await this.getModel();
    const doc = new model(data);
    return doc.save();
  }

  async update(id: string, data: Partial<IUserDocument>): Promise<IUserDocument | null> {
    const model = await this.getModel();
    return model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<IUserDocument | null> {
    const model = await this.getModel();
    return model.findByIdAndDelete(id);
  }

  async deleteAll(): Promise<void> {
    const model = await this.getModel();
    await model.deleteMany({});
  }

  async findByDocumentId(document_id: number): Promise<IUserDocument | null> {
    const model = await this.getModel();
    return model.findOne({ document_id });
  }

  async getLastDocumentId(): Promise<number> {
    const model = await this.getModel();
    const lastDoc = await model.findOne().sort({ document_id: -1 });
    return lastDoc ? lastDoc.document_id : 0;
  }
}
