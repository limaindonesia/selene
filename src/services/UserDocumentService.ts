import { UserDocumentRepository } from "../repositories/UserDocumentRepository";
import { UserInputRepository } from "../repositories/UserInputRepository";
import { IUserDocument } from "../models/UserDocument";
import { IUserInput } from "../models/UserInput";

interface CreateDocumentAndInputParams {
  client_id: string;
  legal_form_id: string;
  status: string;
  is_client_rated?: boolean;
  document_rating?: string;
  generated_at?: string;
  file?: string; 
  input: any;
}

export class UserDocumentService {
  private userDocumentRepository: UserDocumentRepository;
  private userInputRepository: UserInputRepository;

  constructor() {
    this.userDocumentRepository = new UserDocumentRepository();
    this.userInputRepository = new UserInputRepository();
  }


  private async getNextDocumentId(): Promise<number> {
    const lastId = await this.userDocumentRepository.getLastDocumentId();
    return lastId + 1;
  }


  public async createDocumentAndInput(
    params: CreateDocumentAndInputParams
  ): Promise<IUserDocument> {
    const nextDocId = await this.getNextDocumentId();

    const userDocumentData: Partial<IUserDocument> = {
      document_id: nextDocId,
      client_id: params.client_id,
      legal_form_id: params.legal_form_id,
      status: params.status,
      is_client_rated: params.is_client_rated || false,
      document_rating: params.document_rating ? Number(params.document_rating) : undefined,
      generated_at: params.generated_at ? new Date(params.generated_at) : undefined,
      file: params.file ? [params.file] : [],
    };

    const newUserDocument = await this.userDocumentRepository.create(userDocumentData);

    const userInputData: Partial<IUserInput> = {
      document_id: nextDocId,
      input: params.input,
    };

    await this.userInputRepository.create(userInputData);

    return newUserDocument;
  }

  public async getAllUserDocuments(): Promise<IUserDocument[]> {
    return this.userDocumentRepository.findAll();
  }

  public async getUserDocumentById(id: string): Promise<IUserDocument | null> {
    return this.userDocumentRepository.findById(id);
  }

  public async updateUserDocument(
    id: string,
    data: Partial<IUserDocument>
  ): Promise<IUserDocument | null> {
    return this.userDocumentRepository.update(id, data);
  }

  public async deleteUserDocument(id: string): Promise<IUserDocument | null> {
    return this.userDocumentRepository.delete(id);
  }
}
