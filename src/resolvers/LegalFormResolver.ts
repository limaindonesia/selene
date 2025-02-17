import { Resolver, Query, Mutation, Int, Arg } from "type-graphql";
import { LegalForm,  LegalFormInput, PaginatedLegalForms, LegalFormDetail } from "../schemas/LegalFormSchema";
import { HomeResponse } from "../schemas/HomeSchema";
import { LegalFormService } from "../services/LegalFormService";

@Resolver()
export class LegalFormResolver {
  private service: LegalFormService;

  constructor() {
    this.service = new LegalFormService();
  }

  @Query(() => [LegalForm])
  async getLegalForms(): Promise<LegalForm[]> {
    return await this.service.getAllLegalForms();
  }

  @Query(() => LegalForm, { nullable: true })
  async getLegalForm(
    @Arg("id") id: string
  ): Promise<LegalForm | null> {
    return await this.service.getLegalFormById(id);
  }

  @Query(() => HomeResponse)
  async getHome(): Promise<HomeResponse> {
    return await this.service.getHome();
  }

  @Query(() => PaginatedLegalForms)
  async getLegalFormsWithPagination(
    @Arg("page") page: number,
    @Arg("limit") limit: number,
    @Arg("keyword", { nullable: true }) keyword?: string,
    @Arg("category", { nullable: true }) category?: string,
  ): Promise<{ total_items: number; current_page: number; data: any[] }> {
    return await this.service.getLegalFormsWithPagination(page, limit, keyword, category);
  }

  @Query(() => [LegalForm])
  async getFilteredLegalForms(
    @Arg("keyword", { nullable: true }) keyword?: string,
    @Arg("category", { nullable: true }) category?: string,
    @Arg("limit", () => Int, { nullable: true }) limit?: number
  ): Promise<LegalForm[]> {
    return this.service.getLegalFormsByFilters(keyword, category, limit);
  }

  @Query(() => LegalFormDetail, { nullable: true })
  async getLegalFormWithTemplate(@Arg("id") id: string): Promise<LegalFormDetail | null> {
    const result = await this.service.getLegalFormWithTemplate(id);
    if (!result) {
      return null;
    }

    return result as LegalFormDetail;
  }
  
  @Mutation(() => LegalForm)
  async createLegalForm(
    @Arg("data") data: LegalFormInput
  ): Promise<LegalForm> {
    return await this.service.createLegalForm(data);
  }

  @Mutation(() => LegalForm, { nullable: true })
  async updateLegalForm(
    @Arg("id") id: string,
    @Arg("data") data: LegalFormInput
  ): Promise<LegalForm | null> {
    return await this.service.updateLegalForm(id, data);
  }

  @Mutation(() => LegalForm, { nullable: true })
  async deleteLegalForm(
    @Arg("id") id: string
  ): Promise<LegalForm | null> {
    return await this.service.deleteLegalForm(id);
  }
}
