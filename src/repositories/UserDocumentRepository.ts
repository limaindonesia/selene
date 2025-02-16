import { UserDocumentModel, IUserDocument } from "../models/UserDocument";
import { connectDB2 } from "../config/mongoConfig";

export class UserDocumentRepository {
  private async getModel() {
    const connection = await connectDB2();
    return UserDocumentModel(connection);
  }

  async findAll(): Promise<IUserDocument[]> {
    const model = await this.getModel();
    return model.find();
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

  async getLastDocumentId(): Promise<number> {
    const model = await this.getModel();
    const lastDoc = await model.findOne().sort({ document_id: -1 });
    return lastDoc ? lastDoc.document_id : 0;
  }
  
  async findByDocumentId(document_id: Number): Promise<IUserDocument | null> {
    const model = await this.getModel();
    const userDocument = await model.findOne({
      document_id: document_id
    });

    return userDocument;
  }
}
