import Bull from 'bull';
import env from '../config/envConfig';
import { PdfGeneratorService } from './PdfGeneratorService';
import { StorageService } from './StorageService';
import { UserDocumentService } from './UserDocumentService';
import { DocumentStatus } from '../enums/DocumentStatus.enum';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

const pdfQueue = new Bull('pdf-generation', {
  redis: {
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password,
  },
});

const pdfGeneratorService = new PdfGeneratorService();
const storageService = new StorageService();

pdfQueue.process(async (job) => {
  // Create service instances inside the process function to avoid circular dependencies
  const userDocumentService = new UserDocumentService();
  const { id, html } = job.data;
  
  try {
    console.log(`Processing PDF generation for document ID: ${id}`);
    
    const document = await userDocumentService.getUserDocumentById(id);
    if (!document) {
      throw new Error(`Document not found with ID: ${id}`);
    }
    
    const tempPdfPath = path.join(os.tmpdir(), `document-${document.document_id}-${Date.now()}.pdf`);
    await pdfGeneratorService.generatePdf(html, tempPdfPath);
    
    const gcsPath = `documents/${document.document_id}.pdf`;
    const fileUrl = await storageService.uploadFile(tempPdfPath, gcsPath);
    
    await userDocumentService.updateUserDocument(id, {
      status: DocumentStatus.COMPLETED,
      file: [fileUrl],
    });
    
    await unlinkAsync(tempPdfPath);
    
    console.log(`PDF generation completed for document ID: ${id}`);
    return { success: true, fileUrl };
  } catch (error) {
    console.error(`Error generating PDF for document ID: ${id}`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

export class QueueService {
  /**
   * Add a PDF generation job to the queue
   * @param id Document ID (MongoDB ObjectId)
   * @param html HTML content
   * @returns Job ID
   */
  static async addPdfGenerationJob(id: string, html: string): Promise<string> {
    const job = await pdfQueue.add(
      { id, html },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      }
    );
    
    return job.id.toString();
  }
  
  /**
   * Get the status of a PDF generation job
   * @param jobId Job ID
   * @returns Job status
   */
  static async getPdfGenerationJobStatus(jobId: string): Promise<any> {
    const job = await pdfQueue.getJob(jobId);
    if (!job) {
      return { status: 'not_found' };
    }
    
    const state = await job.getState();
    const progress = await job.progress();
    const result = job.returnvalue;
    
    return {
      id: job.id,
      status: state,
      progress,
      result,
    };
  }
  
  /**
   * Clean up failed jobs
   */
  static async cleanupFailedJobs(): Promise<void> {
    const failedJobs = await pdfQueue.getFailed();
    for (const job of failedJobs) {
      await job.remove();
    }
  }
}

pdfQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

pdfQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
});

export { pdfQueue };
