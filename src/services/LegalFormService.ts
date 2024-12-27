import { LegalFormRepository } from "../repositories/LegalFormRepository";
import { ILegalForm, ILegalCategory } from "../models/LegalForm";
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

  async getHome() {
    const categoriesAggregation = await this.repository.countByCategory();
    const templates = await this.repository.findAllByStatus("SHOW");

    const categories = categoriesAggregation.map((category) => ({
      id: category.category,
      name: category.category,
      totalTemplates: category.count,
    }));

    const transformedTemplates = templates.map((template) => ({
      id: template._id.toString(),
      name: template.name,
      description: template.description,
    }));

    return {
      categories,
      templates: transformedTemplates,
    };
  }
}
