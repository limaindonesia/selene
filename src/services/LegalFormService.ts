import { LegalFormRepository } from "../repositories/LegalFormRepository";
import { ILegalForm } from "../models/LegalForm";
import { LoggingMiddleware, ValidationMiddleware, ExecutionTimeMiddleware } from "../middleware/LegalFormMiddleware";

export class LegalFormService {
  private repository: LegalFormRepository;

  constructor() {
    this.repository = new LegalFormRepository();
  }

  private async applyMiddleware(
    middlewares: Function[],
    fn: Function,
    ...args: any[]
  ): Promise<any> {
    let index = -1;

    const next = async (): Promise<any> => {
      index++;
      if (index < middlewares.length) {
        return await middlewares[index](next, ...args);
      }
      return await fn(...args);
    };

    return await next();
  }

  async getAllLegalForms(): Promise<ILegalForm[]> {
    return await this.applyMiddleware(
      [LoggingMiddleware, ExecutionTimeMiddleware],
      this.repository.findAll.bind(this.repository)
    );
  }

  async getLegalFormById(id: string): Promise<ILegalForm | null> {
    return await this.applyMiddleware(
      [LoggingMiddleware, ExecutionTimeMiddleware],
      this.repository.findById.bind(this.repository),
      id
    );
  }

  async createLegalForm(data: Partial<ILegalForm>): Promise<ILegalForm> {
    return await this.applyMiddleware(
      [LoggingMiddleware, ValidationMiddleware, ExecutionTimeMiddleware],
      this.repository.create.bind(this.repository),
      data
    );
  }

  async updateLegalForm(id: string, data: Partial<ILegalForm>): Promise<ILegalForm | null> {
    return await this.applyMiddleware(
      [LoggingMiddleware, ValidationMiddleware, ExecutionTimeMiddleware],
      this.repository.update.bind(this.repository),
      id,
      data
    );
  }

  async deleteLegalForm(id: string): Promise<ILegalForm | null> {
    return await this.applyMiddleware(
      [LoggingMiddleware, ExecutionTimeMiddleware],
      this.repository.delete.bind(this.repository),
      id
    );
  }

  async getHome(): Promise<ILegalForm[]> {
    return await this.repository.findAll();
  }
}
