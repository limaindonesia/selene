import { Resolver, Query, Mutation, Int, Arg } from "type-graphql";
import { GraphQLJSON } from "graphql-scalars";
import { UserInput } from "../schemas/UserInputSchema";
import { UserInputService } from "../services/UserInputService";

@Resolver()
export class UserInputResolver {
  private service: UserInputService;

  constructor() {
    this.service = new UserInputService();
  }

  @Query(() => [UserInput])
  async getAllUserInputs(): Promise<UserInput[]> {
    return this.service.getAllUserInputs();
  }

  @Query(() => UserInput, { nullable: true })
  async getUserInputById(@Arg("id") id: string): Promise<UserInput | null> {
    return this.service.getUserInputById(id);
  }

  @Query(() => UserInput, { nullable: true })
  async getUserInputByDocumentId(
    @Arg("document_id", () => Int) documentId: number
  ): Promise<UserInput | null> {
    return this.service.getUserInputByDocumentId(documentId);
  }

  @Mutation(() => UserInput, { nullable: true })
  async updateUserInputByDocumentId(
    @Arg("document_id") documentId: number,
    @Arg("input", () => GraphQLJSON) input: any
  ): Promise<UserInput | null> {
    return this.service.updateUserInputByDocumentId(documentId, input);
  }
  
}
