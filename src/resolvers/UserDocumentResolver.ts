import { Resolver, Query, Mutation, Arg, Int, Ctx } from "type-graphql";
import { UserDocumentService } from "../services/UserDocumentService";
import { UserDocument, UserDocumentResponse, CreateDocumentWithInput, DocumentGenerationResponse, DocumentJobResponse } from "../schemas/UserDocumentSchema";
import { DocumentStatus } from "../enums/DocumentStatus.enum";
import { createReadStream } from "fs";
import { Response } from "express";
import path from "path";
import { Stream } from "stream";

interface Context {
  req?: Request;
  res: Response;
  clientId?: string;
}

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
  async getUserDocument(
    @Arg("id") id: string,
    @Ctx() { clientId }: Context
  ): Promise<UserDocument | null> {
    if (!clientId) {
      throw new Error("Missing required header: client_id");
    }
    
    const document = await this.service.getUserDocumentById(id);
    
    if (document && document.client_id !== Number(clientId)) {
      throw new Error("Document not found");
    }
    
    return document;
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

  /**
   * Generate a document from HTML
   */
  @Mutation(() => DocumentGenerationResponse)
  async generateDocument(
    @Arg("document_id", () => Int) document_id: number,
    @Arg("generated_html") generated_html: string,
    @Ctx() { clientId }: Context
  ): Promise<DocumentGenerationResponse> {
    try {
      // Verify client has access to this document
      if (!clientId) {
      return {
        success: false,
        message: "Missing required header: client_id",
        data: {
          document_id,
          status: "failed"
        }
      };
      }

      // Verify client has access to this document
      try {
        await this.service.verifyClientAccess(clientId, document_id);
      } catch (error) {
      return {
        success: false,
        message: "Document not found",
        data: {
          document_id,
          status: "failed"
        }
      };
      }
      
      const jobId = await this.service.generateDocument(document_id, generated_html);
      
      return {
        success: true,
        message: "Document generation started",
        data: {
          document_id,
          job_id: jobId,
          status: "processing"
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        data: {
          document_id,
          status: "failed"
        }
      };
    }
  }

  /**
   * Regenerate a document
   */
  @Mutation(() => DocumentGenerationResponse)
  async regenerateDocument(
    @Arg("document_id", () => Int) document_id: number,
    @Ctx() { clientId }: Context
  ): Promise<DocumentGenerationResponse> {
    try {
      // Verify client has access to this document
      if (!clientId) {
      return {
        success: false,
        message: "Missing required header: client_id",
        data: {
          document_id,
          status: "failed"
        }
      };
      }

      try {
        await this.service.verifyClientAccess(clientId, document_id);
      } catch (error) {
      return {
        success: false,
        message: "Document not found",
        data: {
          document_id,
          status: "failed"
        }
      };
      }
      
      const jobId = await this.service.regenerateDocument(document_id);
      
      return {
        success: true,
        message: "Document regeneration started",
        data: {
          document_id,
          job_id: jobId,
          status: "processing"
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        data: {
          document_id,
          status: "failed"
        }
      };
    }
  }

  /**
   * Get document job status
   */
  @Query(() => DocumentJobResponse)
  async getDocumentJobStatus(
    @Arg("job_id") job_id: string,
    @Ctx() { clientId }: Context
  ): Promise<DocumentJobResponse> {
    try {
      if (!clientId) {
      return {
        success: false,
        message: "Missing required header: client_id",
        data: {
          job_id,
          status: "error"
        }
      };
      }
      
      const jobStatus = await this.service.getJobStatus(job_id);
      
      return {
        success: true,
        data: {
          job_id,
          status: jobStatus.status,
          progress: jobStatus.progress,
          result: jobStatus.result
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        data: {
          job_id,
          status: "error"
        }
      };
    }
  }

  /**
   * Download a document
   */
  @Query(() => Boolean)
  async downloadDocument(
    @Arg("document_id", () => Int) document_id: number,
    @Ctx() { res, clientId }: Context
  ): Promise<boolean> {
    try {
      if (!clientId) {
        res.status(401).json({
          success: false,
          message: "Missing required header: client_id"
        });
        return false;
      }

      try {
        await this.service.verifyClientAccess(clientId, document_id);
      } catch (error) {
        res.status(404).json({
          success: false,
          message: "Document not found"
        });
        return false;
      }
      
      const fileStreamOrPath = await this.service.downloadDocument(document_id);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="document-${document_id}.pdf"`);
      
      // Handle both stream and file path cases
      if (typeof fileStreamOrPath === 'string') {
        const fileStream = createReadStream(fileStreamOrPath);
        fileStream.pipe(res);
      } else {
        fileStreamOrPath.pipe(res);
      }
      
      return true;
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Stream a document
   */
  @Query(() => Boolean)
  async streamDocument(
    @Arg("document_id", () => Int) document_id: number,
    @Ctx() { res, clientId }: Context
  ): Promise<boolean> {
    try {
      if (!clientId) {
        res.status(401).json({
          success: false,
          message: "Missing required header: client_id"
        });
        return false;
      }

      try {
        await this.service.verifyClientAccess(clientId, document_id);
      } catch (error) {
        res.status(404).json({
          success: false,
          message: "Document not found"
        });
        return false;
      }
      
      const streamOrPath = await this.service.getDocumentStream(document_id);
      
      // Set headers for streaming
      res.setHeader('Content-Type', 'application/pdf');
      
      // For mobile clients, we can use inline content disposition
      // or application/octet-stream content type
      const userAgent = res.req.headers['user-agent'] || '';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      if (isMobile) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="document-${document_id}.pdf"`);
      } else {
        res.setHeader('Content-Disposition', `inline; filename="document-${document_id}.pdf"`);
      }
      
      // Handle both stream and file path cases
      if (typeof streamOrPath === 'string') {
        const fileStream = createReadStream(streamOrPath);
        fileStream.pipe(res);
      } else {
        streamOrPath.pipe(res);
      }
      
      return true;
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
}
