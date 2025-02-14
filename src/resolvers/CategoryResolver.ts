import { Resolver, Query, Mutation, Arg } from "type-graphql";
import { Category, CategoryInput } from "../schemas/CategorySchema";
import { CategoryService } from "../services/CategoryService";

@Resolver()
export class CategoryResolver {
  private service: CategoryService;

  constructor() {
    this.service = new CategoryService();
  }

  @Query(() => [Category])
  async getCategories(): Promise<Category[]> {
    return this.service.getAllCategories();
  }

  @Query(() => Category, { nullable: true })
  async getCategory(@Arg("id") id: string): Promise<Category | null> {
    return this.service.getCategoryById(id);
  }

  @Mutation(() => Category)
  async createCategory(
    @Arg("data") data: CategoryInput
  ): Promise<Category> {
    return this.service.createCategory(data);
  }

  @Mutation(() => Category, { nullable: true })
  async updateCategory(
    @Arg("id") id: string,
    @Arg("data") data: CategoryInput
  ): Promise<Category | null> {
    return this.service.updateCategory(id, data);
  }

  @Mutation(() => Category, { nullable: true })
  async deleteCategory(@Arg("id") id: string): Promise<Category | null> {
    return this.service.deleteCategory(id);
  }
}
