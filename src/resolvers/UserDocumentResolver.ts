import { Resolver, Query, Mutation, Arg, Int } from "type-graphql";
import { UserDocumentService } from "../services/UserDocumentService";
import { UserDocument, UserDocumentResponse, CreateDocumentWithInput } from "../schemas/UserDocumentSchema";
import { DocumentStatus } from "../enums/DocumentStatus.enum";

@Resolver()
export class UserDocumentResolver {
  private service: UserDocumentService;

  constructor() {
    this.service = new UserDocumentService();
  }

  @Query(() => UserDocumentResponse)
  async getUserDocuments(
    @Arg("page", () => Int, { nullable: true }) page?: number,
    @Arg("limit", () => Int, { nullable: true }) limit?: number,
    @Arg("skip", () => Int, { nullable: true }) skip?: number,
    @Arg("status", () => [String], { nullable: true }) status?: string[],
    @Arg("paginate", () => Boolean, { nullable: true }) paginate?: boolean
  ): Promise<UserDocumentResponse> {
    if (paginate) {
      return this.service.getAllUserDocuments(page || 1, limit || 10, status);
    } else {
      return this.service.getAllUserDocuments(undefined, undefined, status);
    }
  }

  @Query(() => UserDocument, { nullable: true })
  async getUserDocument(@Arg("id") id: string): Promise<UserDocument | null> {
    return this.service.getUserDocumentById(id);
  }

  @Mutation(() => UserDocument)
  async createDocumentAndInput(
    @Arg("data") data: CreateDocumentWithInput
  ): Promise<UserDocument> {
    return this.service.createDocumentAndInput({
      client_id: data.client_id,
      legal_form_id: data.legal_form_id,
      status: data.status,
      is_client_rated: data.is_client_rated,
      document_rating: data.document_rating,
      generated_at: data.generated_at,
      file: data.file,
      input: data.input,
    });
  }

  @Mutation(() => UserDocument)
  async changeUserDocumentStatus(
    @Arg("document_id") document_id: number, 
    @Arg("status", () => Int) status: DocumentStatus
  ): Promise<UserDocument> {
    return await this.service.changeUserDocumentStatus(document_id, status);
  }
}
