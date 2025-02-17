import { Resolver, Query, Mutation, Arg } from "type-graphql";
import { UserDocumentService } from "../services/UserDocumentService";
import { UserDocument } from "../schemas/UserDocumentSchema";
import { CreateDocumentWithInput } from "../schemas/UserDocumentSchema";

@Resolver()
export class UserDocumentResolver {
  private service: UserDocumentService;

  constructor() {
    this.service = new UserDocumentService();
  }

  @Query(() => [UserDocument])
  async getUserDocuments(): Promise<UserDocument[]> {
    return this.service.getAllUserDocuments();
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
    @Arg("document_id") document_id: number, @Arg("status") status: number
  ): Promise<UserDocument> {
    return await this.service.changeUserDocumentStatus(document_id, status);
  }
}
