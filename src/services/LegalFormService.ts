import { LegalFormRepository } from "../repositories/LegalFormRepository";
import { ILegalForm } from "../models/LegalForm";

export class LegalFormService {
  private repository: LegalFormRepository;

  constructor() {
    this.repository = new LegalFormRepository();
  }

  async getAllLegalForms(): Promise<ILegalForm[]> {
    return await this.repository.findAll();
  }

  async getLegalFormById(id: string): Promise<ILegalForm | null> {
    return await this.repository.findById(id);
  }

  async createLegalForm(data: Partial<ILegalForm>): Promise<ILegalForm> {
    return await this.repository.create(data);
  }

  async updateLegalForm(id: string, data: Partial<ILegalForm>): Promise<ILegalForm | null> {
    return await this.repository.update(id, data);
  }

  async deleteLegalForm(id: string): Promise<ILegalForm | null> {
    return await this.repository.delete(id);
  }
}
