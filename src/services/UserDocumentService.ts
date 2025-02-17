import { UserDocumentRepository } from "../repositories/UserDocumentRepository";
import { UserInputRepository } from "../repositories/UserInputRepository";
import { LegalFormRepository } from "../repositories/LegalFormRepository";
import { IUserDocument } from "../models/UserDocument";
import { IUserInput } from "../models/UserInput";
import { ILegalForm } from "../models/LegalForm";
import { UserDocument, UserDocumentResponse, LegalFormDetails } from "../schemas/UserDocumentSchema";
import { DocumentStatus } from "../enums/DocumentStatus.enum";

interface CreateDocumentAndInputParams {
  client_id: string;
  legal_form_id: string;
  status: number;
  is_client_rated?: boolean;
  document_rating?: string;
  generated_at?: string;
  file?: string; 
  input: any;
}

export class UserDocumentService {
  private userDocumentRepository: UserDocumentRepository;
  private userInputRepository: UserInputRepository;
  private legalFormRepository: LegalFormRepository;

  constructor() {
    this.userDocumentRepository = new UserDocumentRepository();
    this.userInputRepository = new UserInputRepository();
    this.legalFormRepository = new LegalFormRepository();
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

  public async getAllUserDocuments(
    page: number = 1,
    pageSize: number = 10,
    status?: string[]
  ): Promise<UserDocumentResponse> {
    const statusNumbers = status?.map(s => DocumentStatus[s as keyof typeof DocumentStatus]);

    const { data, totalItems, totalPages } = await this.userDocumentRepository.findAllWithPagination(
      page,
      pageSize,
      statusNumbers
    );

    const documentsWithLegalForm = await Promise.all(
      data.map(async (doc): Promise<UserDocument> => {
        const legalForm = await this.legalFormRepository.findById(doc.legal_form_id);
        const docObj = doc.toObject();
        
        let legalFormDetails: LegalFormDetails | undefined;
        if (legalForm) {
          const legalFormObj = legalForm.toObject();
          legalFormDetails = {
            id: legalFormObj.id,
            category_id: legalFormObj.category, // Using category as category_id
            name: legalFormObj.name,
            price: legalFormObj.price,
            final_price: legalFormObj.final_price,
            description: legalFormObj.description,
            picture_url: legalFormObj.picture_url,
            category: legalFormObj.category,
            rating: 4.0, // You might want to calculate this dynamically
            total_created: 300 // You might want to calculate this dynamically
          };
        }

        return {
          ...docObj,
          id: docObj.id,
          document_id: docObj.document_id,
          legal_form_id: docObj.legal_form_id,
          client_id: docObj.client_id,
          status: docObj.status,
          is_client_rated: docObj.is_client_rated,
          document_rating: docObj.document_rating,
          generated_at: docObj.generated_at ? docObj.generated_at.toISOString() : undefined,
          file: docObj.file,
          createdAt: docObj.createdAt,
          updatedAt: docObj.updatedAt,
          legal_form: legalFormDetails
        };
      })
    );

    const response: UserDocumentResponse = {
      data: documentsWithLegalForm,
      message: "Documents retrieved successfully"
    };

    if (page !== undefined && pageSize !== undefined) {
      response.pagination = {
        total: totalItems,
        count: documentsWithLegalForm.length,
        per_page: pageSize,
        current_page: page,
        total_pages: totalPages,
        links: {
          next: page < totalPages ? `?page=${page + 1}&pageSize=${pageSize}` : undefined
        }
      };
    }

    return response;
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

  public async changeUserDocumentStatus(document_id: number, status: number): Promise<IUserDocument | null> {
    const userDocument = await this.userDocumentRepository.findByDocumentId(document_id);
    if (!userDocument) {
      return null;
    }
    userDocument.status = status;
    return await this.userDocumentRepository.update(userDocument.id, userDocument);
  }

  public async deleteAllUserDocuments(): Promise<void> {
    return this.userDocumentRepository.deleteAll();
  }
}
