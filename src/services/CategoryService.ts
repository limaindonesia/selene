import { CategoryRepository } from "../repositories/CategoryRepository";
import { ICategory } from "../models/Category";

export class CategoryService {
  private repository: CategoryRepository;

  constructor() {
    this.repository = new CategoryRepository();
  }

  async getAllCategories(): Promise<ICategory[]> {
    return this.repository.findAll();
  }

  async getCategoryById(id: string): Promise<ICategory | null> {
    return this.repository.findById(id);
  }

  async createCategory(data: Partial<ICategory>): Promise<ICategory> {
    return this.repository.create(data);
  }

  async updateCategory(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    return this.repository.update(id, data);
  }

  async deleteCategory(id: string): Promise<ICategory | null> {
    return this.repository.delete(id);
  }
}
