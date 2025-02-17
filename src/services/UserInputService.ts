import { UserInputRepository } from "../repositories/UserInputRepository";
import { IUserInput } from "../models/UserInput";

export class UserInputService {
  private userInputRepository: UserInputRepository;

  constructor() {
    this.userInputRepository = new UserInputRepository();
  }

  public async getAllUserInputs(): Promise<IUserInput[]> {
    return this.userInputRepository.findAll();
  }

  public async getUserInputById(id: string): Promise<IUserInput | null> {
    return this.userInputRepository.findById(id);
  }

  public async createUserInput(data: Partial<IUserInput>): Promise<IUserInput> {
    return this.userInputRepository.create(data);
  }

  public async updateUserInput(id: string, data: Partial<IUserInput>): Promise<IUserInput | null> {
    return this.userInputRepository.update(id, data);
  }

  public async deleteUserInput(id: string): Promise<IUserInput | null> {
    return this.userInputRepository.delete(id);
  }

  public async updateUserInputByDocumentId(
    documentId: number, 
    inputData: any
  ): Promise<IUserInput | null> {
    return this.userInputRepository.updateByDocumentId(documentId, { input: inputData });
  }
  
  public async getUserInputByDocumentId(documentId: number): Promise<IUserInput | null> {
    return this.userInputRepository.findOneByDocumentId(documentId);
  }
}
