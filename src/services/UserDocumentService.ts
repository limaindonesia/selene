import { UserDocumentRepository } from "../repositories/UserDocumentRepository";
import { UserInputRepository } from "../repositories/UserInputRepository";
import { LegalFormRepository } from "../repositories/LegalFormRepository";
import { IUserDocument } from "../models/UserDocument";
import { IUserInput } from "../models/UserInput";
import { ILegalForm } from "../models/LegalForm";
import { UserDocument, UserDocumentResponse, LegalFormDetails } from "../schemas/UserDocumentSchema";
import { DocumentStatus } from "../enums/DocumentStatus.enum";
// Import QueueService statically to avoid circular dependency
import * as QueueServiceModule from "./QueueService";
import { StorageService } from "./StorageService";
import { PdfGeneratorService } from "./PdfGeneratorService";
import fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

interface CreateDocumentAndInputParams {
  client_id: number | string;
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
  private storageService: StorageService;
  private pdfGeneratorService: PdfGeneratorService;

  constructor() {
    this.userDocumentRepository = new UserDocumentRepository();
    this.userInputRepository = new UserInputRepository();
    this.legalFormRepository = new LegalFormRepository();
    this.storageService = new StorageService();
    this.pdfGeneratorService = new PdfGeneratorService();
  }

  private async getNextDocumentId(): Promise<number> {
    const lastId = await this.userDocumentRepository.getLastDocumentId();
    return lastId + 1;
  }

  public async createDocumentAndInput(
    params: CreateDocumentAndInputParams
  ): Promise<any> {
    const nextDocId = await this.getNextDocumentId();

    const clientId = typeof params.client_id === 'string' 
      ? parseInt(params.client_id, 10) || 0
      : params.client_id;

    const userDocumentData: Partial<IUserDocument> = {
      document_id: nextDocId,
      client_id: clientId,
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

    const relatedLegalForm: ILegalForm | null = await this.legalFormRepository.findById(newUserDocument.legal_form_id);
    
    return {
      id: newUserDocument.id,
      document_id: newUserDocument.document_id,
      legal_form_id: newUserDocument.legal_form_id,
      client_id: newUserDocument.client_id,
      status: newUserDocument.status,
      is_client_rated: newUserDocument.is_client_rated,
      document_rating: newUserDocument.document_rating,
      generated_at: newUserDocument.generated_at,
      file: newUserDocument.file,
      createdAt: newUserDocument.createdAt,
      updatedAt: newUserDocument.updatedAt,

      legal_form: relatedLegalForm ? {
        id: relatedLegalForm.id,
        name: relatedLegalForm.name,
        price: Number(relatedLegalForm.price),
        final_price: Number(relatedLegalForm.final_price),
      } : null,
    };
  }

  public async getAllUserDocuments(
    page?: number,
    pageSize?: number,
    status?: number[],
    client_id?: number
  ): Promise<UserDocumentResponse> {
    const usePagination = page !== undefined && pageSize !== undefined;
    const effectivePage = usePagination ? page : 1;
    const effectivePageSize = usePagination ? pageSize : 10;

    let filter: any = {};
    
    if (status && status.length > 0) {
      filter.status = { $in: status };
    }
    
    if (client_id !== undefined) {
      filter.client_id = client_id;
    }

    const { data, totalItems, totalPages } = await this.userDocumentRepository.findAllWithPagination(
      effectivePage,
      effectivePageSize,
      filter
    );

    const documentsWithLegalForm = await Promise.all(
      data.map(async (doc): Promise<UserDocument> => {
        const legalForm = await this.legalFormRepository.findById(doc.legal_form_id);
        const docObj = doc.toObject();
        
        let legalFormDetails: LegalFormDetails | undefined;
        if (legalForm) {
          const legalFormObj = legalForm.toObject();
          legalFormDetails = {
            id: legalFormObj._id,
            category_id: legalFormObj.category,
            name: legalFormObj.name,
            price: Number(legalFormObj.price),
            final_price: Number(legalFormObj.final_price),
            description: legalFormObj.description,
            picture_url: legalFormObj.picture_url,
            category: legalFormObj.category,
            rating: 4.0,
            total_created: 300
          };
        }

        return {
          ...docObj,
          id: docObj._id,
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

    if (usePagination) {
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

  public async getUserDocumentByDocumentId(documentId: number): Promise<IUserDocument | null> {
    return this.userDocumentRepository.findByDocumentId(documentId);
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

  public async changeUserDocumentStatus(id: string, status: number): Promise<IUserDocument | null> {
    const userDocument = await this.userDocumentRepository.findById(id);
    if (!userDocument) {
      return null;
    }
    userDocument.status = status;
    return await this.userDocumentRepository.update(userDocument.id, userDocument);
  }

  public async deleteAllUserDocuments(): Promise<void> {
    return this.userDocumentRepository.deleteAll();
  }

  /**
   * Verify that a client has access to a document
   * @param client_id Client ID from header
   * @param id Document ID (MongoDB ObjectId)
   * @throws Error if client does not have access to document
   */
  public async verifyClientAccess(client_id: string, id: string): Promise<void> {
    const existingDocument = await this.userDocumentRepository.findById(id);
    if (!existingDocument) {
      throw new Error('Document not found');
    }

    if (existingDocument.client_id !== Number(client_id)) {
      throw new Error('Document not found');
    }
  }

  /**
   * Get the status of a PDF generation job
   * @param jobId Job ID
   * @returns Job status
   */
  public async getJobStatus(jobId: string): Promise<any> {
    return QueueServiceModule.QueueService.getPdfGenerationJobStatus(jobId);
  }

  /**
   * Generate a document from HTML
   * @param id Document ID (MongoDB ObjectId)
   * @param generated_html HTML content
   * @returns Job ID
   */
  public async generateDocument(id: string, generated_html: string): Promise<string> {
    const existingDocument = await this.userDocumentRepository.findById(id);
    if (!existingDocument) {
      throw new Error('Document not found');
    }

    await this.userDocumentRepository.update(existingDocument.id, {
      status: DocumentStatus.GENERATING,
      generated_html,
    });

    const jobId = await QueueServiceModule.QueueService.addPdfGenerationJob(existingDocument.id, generated_html);
    return jobId;
  }

  /**
   * Regenerate a document
   * @param id Document ID (MongoDB ObjectId)
   * @returns Job ID
   */
  public async regenerateDocument(id: string): Promise<string> {
    const existingDocument = await this.userDocumentRepository.findById(id);
    if (!existingDocument) {
      throw new Error('Document not found');
    }

    if (existingDocument.status !== DocumentStatus.GENERATING) {
      throw new Error(`Document is not in GENERATING status. Current status: ${existingDocument.status}`);
    }

    if (!existingDocument.generated_html) {
      throw new Error('Document HTML not found');
    }

    const jobId = await QueueServiceModule.QueueService.addPdfGenerationJob(existingDocument.id, existingDocument.generated_html);
    return jobId;
  }

  /**
   * Get document file path in Google Cloud Storage
   * @param id Document ID (MongoDB ObjectId)
   * @returns File path
   */
  private async getDocumentFilePath(id: string): Promise<string> {
    const document = await this.userDocumentRepository.findById(id);
    if (!document) {
      throw new Error('Document not found');
    }
    return `documents/${document.document_id}.pdf`;
  }

  /**
   * Download a document
   * @param id Document ID (MongoDB ObjectId)
   * @returns Stream for the document
   */
  public async downloadDocument(id: string): Promise<NodeJS.ReadableStream | string> {
    const existingDocument = await this.userDocumentRepository.findById(id);
    if (!existingDocument) {
      throw new Error('Document not found');
    }

    if (existingDocument.status !== DocumentStatus.COMPLETED) {
      throw new Error(`Document is not ready for download. Current status: ${existingDocument.status}`);
    }

    if (!existingDocument.file || existingDocument.file.length === 0) {
      throw new Error('Document file not found');
    }

    const gcsPath = await this.getDocumentFilePath(id);
    
    const fileExists = await this.storageService.fileExists(gcsPath);
    if (!fileExists) {
      throw new Error('Document file not found in storage');
    }
    
    return this.storageService.getFileStream(gcsPath);
  }

  /**
   * Get a stream for a document
   * @param id Document ID (MongoDB ObjectId)
   * @returns Stream
   */
  public async getDocumentStream(id: string): Promise<NodeJS.ReadableStream | string> {
    // Reuse the download method since it now returns a stream directly
    return this.downloadDocument(id);
  }
}
