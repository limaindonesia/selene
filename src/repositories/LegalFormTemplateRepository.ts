import { LegalFormTemplateModel, ILegalFormTemplate } from "../models/LegalFormTemplate";
import { connectDB1 } from "../config/mongoConfig";

export class LegalFormTemplateRepository {
  private async getModel() {
    const connection = await connectDB1();
    return LegalFormTemplateModel(connection);
  }

  async findById(id: string): Promise<ILegalFormTemplate | null> {
    const model = await this.getModel();
    return model.findById(id);
  }
}
