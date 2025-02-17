import { LegalFormRepository } from "../repositories/LegalFormRepository";
import { LegalFormTemplateRepository } from "../repositories/LegalFormTemplateRepository";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { ILegalForm } from "../models/LegalForm";
import { ILegalFormTemplate } from "../models/LegalFormTemplate";
import { LoggingMiddleware, ValidationMiddleware, ExecutionTimeMiddleware } from "../middleware/LegalFormMiddleware";

export class LegalFormService {
  private repository: LegalFormRepository;
  private templateRepository: LegalFormTemplateRepository;
  private categoryRepository: CategoryRepository;

  constructor() {
    this.repository = new LegalFormRepository();
    this.templateRepository = new LegalFormTemplateRepository();
    this.categoryRepository = new CategoryRepository();
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
    const templates = await this.repository.findAllByHighlight();
  
    const categories = await Promise.all(
      categoriesAggregation.map(async (category) => {
        try {
          const data = await this.categoryRepository.findByStringId(category.category);
          
          if (!data) {
            return;
          }
  
          return {
            id: category.category,
            name: data.name,
            icon_url: data.icon_url,
            description: data.description,
            total_templates: category.count,
          };
        } catch (error) {
          console.error("Error fetching category data:", error);
          return;
        }
      })
    );
  
    const transformedTemplates = templates.map((template) => ({
      id: template._id.toString(),
      name: template.name,
      description: template.description,
      picture_url: template.picture_url,
    }));

    return {
      categories,
      templates: transformedTemplates,
    };
  }
  
  async getLegalFormsWithPagination(
    page: number,
    limit: number,
    keyword?: string,
    category?: string,
  ): Promise<{ total_items: number; current_page: number; data: any[] }> {

    var filterCategory: any;

    if (category) {
      const categories = category.split(/\s*,\s*/);
      const categoryData = await this.categoryRepository.findByNames(categories);
  
      filterCategory = categoryData.map(({ string_id }) => string_id);
    }

    const { total_items, current_page, data } = await this.repository.findAllWithPagination(
      page,
      limit,
      keyword,
      category ?? filterCategory
    );
  
    const formattedData = await Promise.all(data.map(async (legalForm) => {
      try {
        const category = await this.categoryRepository.findByStringId(legalForm.category);
  
        return {
          id: legalForm.id,
          category: category ? category.name : "",
          name: legalForm.name,
          price:  legalForm.price ? `Rp${legalForm.price.toLocaleString()}` : `Rp0`,
          final_price: legalForm.final_price ? `Rp${legalForm.final_price.toLocaleString()}` : `Rp0`,
          description: legalForm.description,
          picture_url: legalForm.picture_url,
          rating: "4.0",  // TO DO Replace with actual rating calculation
          total_created: 300,  // TO DO Replace with actual total_created calculation
        };
      } catch (error) {
        console.error(`Error fetching category for LegalForm ${legalForm.id}:`, error);
        return {
          id: legalForm.id,
          category: "",
          name: legalForm.name,
          price:  legalForm.price ? `Rp${legalForm.price.toLocaleString()}` : `Rp0`,
          final_price: legalForm.final_price ? `Rp${legalForm.final_price.toLocaleString()}` : `Rp0`,
          description: legalForm.description,
          picture_url: legalForm.picture_url,
          rating: "4.0",  // TO DO Replace with actual rating calculation
          total_created: 300,  // TO DO Replace with actual total_created calculation
        };
      }
    }));
  
    return {
      total_items,
      current_page,
      data: formattedData,
    };
  }

  async getLegalFormsByFilters(
    keyword?: string,
    category?: string,
    limit?: number
  ): Promise<any | null>  {
    
    var filterCategory: any;

    if (category) {
      const categories = category.split(/\s*,\s*/);
      const categoryData = await this.categoryRepository.findByNames(categories);
  
      filterCategory = categoryData.map(({ string_id }) => string_id);
    }

    const data = await this.repository.findByFilters(keyword, filterCategory, limit);
 
    const formattedData = await Promise.all(data.map(async (legalForm) => {
      try {
        const category = await this.categoryRepository.findByStringId(legalForm.category);
  
        return {
          id: legalForm.id,
          category: category ? category.name : "",
          name: legalForm.name,
          price:  legalForm.price ? `Rp${legalForm.price.toLocaleString()}` : `Rp0`,
          final_price: legalForm.final_price ? `Rp${legalForm.final_price.toLocaleString()}` : `Rp0`,
          description: legalForm.description,
          picture_url: legalForm.picture_url,
          rating: "4.0",  // TO DO Replace with actual rating calculation
          total_created: 300,  // TO DO Replace with actual total_created calculation
        };
      } catch (error) {
        console.error(`Error fetching category for LegalForm ${legalForm.id}:`, error);
        return {
          id: legalForm.id,
          category: "",
          name: legalForm.name,
          price:  legalForm.price ? `Rp${legalForm.price.toLocaleString()}` : `Rp0`,
          final_price: legalForm.final_price ? `Rp${legalForm.final_price.toLocaleString()}` : `Rp0`,
          description: legalForm.description,
          picture_url: legalForm.picture_url,
          rating: "4.0",  // TO DO Replace with actual rating calculation
          total_created: 300,  // TO DO Replace with actual total_created calculation
        };
      }
    }));

    return formattedData;
  }

  public async getLegalFormWithTemplate(id: string): Promise<any | null> {
    const legalForm: ILegalForm | null = await this.repository.findById(id);
    if (!legalForm) {
      return null;
    }

    const templateDoc: ILegalFormTemplate | null = await this.templateRepository.findById(
      legalForm.template_doc_id
    );

    const category = await this.categoryRepository.findByStringId(legalForm.category);

    const finalResult = {
      id: legalForm.id,
      name: legalForm.name,
      price:  legalForm.price ? `Rp${legalForm.price.toLocaleString()}` : `Rp0`,
      final_price: legalForm.final_price ? `Rp${legalForm.final_price.toLocaleString()}` : `Rp0`,
      description: legalForm.description,
      picture_url: legalForm.picture_url,
      category: category.name,
      rating: "4.0",
      total_created: 300,
      template: templateDoc ? templateDoc.template : "",
    };

    return finalResult;
  }
}
