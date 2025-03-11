import { LegalFormRepository } from "../repositories/LegalFormRepository";
import { LegalFormTemplateRepository } from "../repositories/LegalFormTemplateRepository";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { UserInputRepository } from "../repositories/UserInputRepository";
import { ILegalForm, FormDetail } from "../models/LegalForm";
import { UserInput } from "../models/UserInput";
import { ILegalFormTemplate } from "../models/LegalFormTemplate";
import { LoggingMiddleware, ValidationMiddleware, ExecutionTimeMiddleware } from "../middleware/LegalFormMiddleware";

export class LegalFormService {
  private repository: LegalFormRepository;
  private templateRepository: LegalFormTemplateRepository;
  private categoryRepository: CategoryRepository;
  private userInputRepository: UserInputRepository;

  constructor() {
    this.repository = new LegalFormRepository();
    this.templateRepository = new LegalFormTemplateRepository();
    this.categoryRepository = new CategoryRepository();
    this.userInputRepository = new UserInputRepository();
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
          slug: legalForm.slug,
          formatted_price: legalForm.formatted_price,
          formatted_original_price: legalForm.formatted_original_price,
          description: legalForm.description,
          picture_url: legalForm.picture_url,
          rating: legalForm.rating,
          total_created: legalForm.total_created,
        };
      } catch (error) {
        console.error(`Error fetching category for LegalForm ${legalForm.id}:`, error);
        return {
          id: legalForm.id,
          category: "",
          name: legalForm.name,
          slug: legalForm.slug,
          formatted_price: legalForm.formatted_price,
          formatted_original_price: legalForm.formatted_original_price,
          description: legalForm.description,
          picture_url: legalForm.picture_url,
          rating: legalForm.rating,
          total_created: legalForm.total_created,
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
          formatted_price: legalForm.formatted_price,
          formatted_original_price: legalForm.formatted_original_price,
          description: legalForm.description,
          picture_url: legalForm.picture_url,
          rating: legalForm.rating,
          total_created: legalForm.total_created,
        };
      } catch (error) {
        console.error(`Error fetching category for LegalForm ${legalForm.id}:`, error);
        return {
          id: legalForm.id,
          category: "",
          name: legalForm.name,
          formatted_price: legalForm.formatted_price,
          formatted_original_price: legalForm.formatted_original_price,
          description: legalForm.description,
          picture_url: legalForm.picture_url,
          rating: legalForm.rating,
          total_created: legalForm.total_created,
        };
      }
    }));

    return formattedData;
  }

  public async getLegalFormWithTemplate(id: string, preview: boolean = false): Promise<any | null> {
    const legalForm: ILegalForm | null = await this.repository.findById(id);
    if (!legalForm) {
      return null;
    }

    const templateDoc: ILegalFormTemplate | null = await this.templateRepository.findById(
      legalForm.template_doc_id
    );

    const category = await this.categoryRepository.findByStringId(legalForm.category);

    let template = templateDoc ? templateDoc.template : "";

    let formDetail: FormDetail[] = legalForm.form_detail;
    
    if (preview) {

      const step1Data = formDetail.find((form) => form.step === 1);

      if (!step1Data) {
        formDetail = [];
        template = '';
      } else {
        formDetail = [step1Data];
      }
    }

    const finalResult = {
      id: legalForm.id,
      name: legalForm.name,
      formatted_price: legalForm.formatted_price,
      formatted_original_price: legalForm.formatted_original_price,
      description: legalForm.description,
      picture_url: legalForm.picture_url,
      category: category.name,
      rating: legalForm.rating,
      total_created: legalForm.total_created,
      template: template,
      form_detail: formDetail,
    };

    return finalResult;
  }

  public async getLegalFormWithAnswer(id: string, document_id: number): Promise<any | null> {
    const legalForm: ILegalForm | null = await this.repository.findById(id);
    if (!legalForm) {
      return null;
    }

    const templateDoc: ILegalFormTemplate | null = await this.templateRepository.findById(
      legalForm.template_doc_id
    );

    const category = await this.categoryRepository.findByStringId(legalForm.category);

    const formDetail: FormDetail[] = legalForm.form_detail;

    const userInput = await this.userInputRepository.findOneByDocumentId(document_id);

    const combinedResult = await this.combineTemplateWithAnswers(formDetail, userInput.input);

    const finalResult = {
      id: legalForm.id,
      name: legalForm.name,
      formatted_price: legalForm.formatted_price,
      formatted_original_price: legalForm.formatted_original_price,
      description: legalForm.description,
      picture_url: legalForm.picture_url,
      category: category.name,
      rating: legalForm.rating,
      total_created: legalForm.total_created,
      template: templateDoc ? templateDoc.template : "",
      form_detail: combinedResult,
    };

    return finalResult;
  }

  async combineTemplateWithAnswers(
    formDetail: FormDetail[],
    userInput: UserInput[]
  ): Promise<FormDetail[]> {

    formDetail.forEach((step) => {
      step.questions.forEach((question) => {
        const matchedInput = userInput.find((input) => input.no === question.no);
        if (matchedInput) {
          if (question.element_type === "BASIC" && question.details_basic) {
            question.details_basic.answer = matchedInput.answer ?? '';
          }
          else if (question.element_type === "ADVANCE" && question.details_advance) {
            question.details_advance.answers = matchedInput.answers ?? [];
          }
        }
      });
    });
  
    return formDetail;
  }
  
  public async getLegalFormDetailById(id: string): Promise<any | null> {
    const legalForm: ILegalForm | null = await this.repository.findById(id);
    if (!legalForm) {
      return null;
    }

    const category = await this.categoryRepository.findByStringId(legalForm.category);

    const finalResult = {
      id: legalForm.id,
      name: legalForm.name,
      formatted_price: legalForm.formatted_price,
      formatted_original_price: legalForm.formatted_original_price,
      description: legalForm.description,
      picture_url: legalForm.picture_url,
      category: category.name,
      rating: legalForm.rating,
      total_created: legalForm.total_created,
    };

    return finalResult;
  }
}
