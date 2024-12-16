import { Resolver, Query, Mutation, Arg } from "type-graphql";
import { LegalForm, LegalFormCategory,  LegalFormInput } from "../schemas/LegalFormSchema";
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
  async getLegalForm(@Arg("id") id: string): Promise<LegalForm | null> {
    return await this.service.getLegalFormById(id);
  }

  @Query(() => [LegalFormCategory])
  async getHome(): Promise<LegalFormCategory[]> {
    return await this.service.getHome();
  }

  @Mutation(() => LegalForm)
  async createLegalForm(@Arg("data") data: LegalFormInput): Promise<LegalForm> {
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
  async deleteLegalForm(@Arg("id") id: string): Promise<LegalForm | null> {
    return await this.service.deleteLegalForm(id);
  }
}
