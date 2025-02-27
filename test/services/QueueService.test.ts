import { QueueService, pdfQueue } from '../../src/services/QueueService';
import { PdfGeneratorService } from '../../src/services/PdfGeneratorService';
import { StorageService } from '../../src/services/StorageService';
import { UserDocumentService } from '../../src/services/UserDocumentService';
import { DocumentStatus } from '../../src/enums/DocumentStatus.enum';
import Bull from 'bull';

jest.mock('bull', () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job123' }),
    process: jest.fn(),
    getJob: jest.fn().mockResolvedValue({
      id: 'job123',
      getState: jest.fn().mockResolvedValue('completed'),
      progress: jest.fn().mockResolvedValue(100),
      returnvalue: { success: true, fileUrl: 'https://example.com/file.pdf' }
    }),
    getFailed: jest.fn().mockResolvedValue([{ remove: jest.fn() }]),
    on: jest.fn()
  }));
});

jest.mock('../../src/services/PdfGeneratorService', () => {
  return {
    PdfGeneratorService: jest.fn().mockImplementation(() => ({
      generatePdf: jest.fn().mockResolvedValue('/tmp/generated.pdf')
    }))
  };
});

jest.mock('../../src/services/StorageService', () => {
  return {
    StorageService: jest.fn().mockImplementation(() => ({
      uploadFile: jest.fn().mockResolvedValue('https://storage.googleapis.com/bucket/path/to/file.pdf')
    }))
  };
});

jest.mock('../../src/services/UserDocumentService', () => {
  return {
    UserDocumentService: jest.fn().mockImplementation(() => ({
      getUserDocumentByDocumentId: jest.fn().mockResolvedValue({
        id: 'doc123',
        document_id: 12345,
        status: DocumentStatus.GENERATING,
        generated_html: '<html>Test</html>'
      }),
      changeUserDocumentStatus: jest.fn().mockResolvedValue({
        id: 'doc123',
        document_id: 12345,
        status: DocumentStatus.COMPLETED
      }),
      updateUserDocument: jest.fn().mockResolvedValue({
        id: 'doc123',
        document_id: 12345,
        file: ['https://storage.googleapis.com/bucket/path/to/file.pdf']
      })
    }))
  };
});

jest.mock('fs', () => {
  return {
    promises: {
      unlink: jest.fn().mockResolvedValue(undefined)
    }
  };
});

jest.mock('path', () => {
  return {
    join: jest.fn().mockReturnValue('/tmp/file.pdf')
  };
});

jest.mock('os', () => {
  return {
    tmpdir: jest.fn().mockReturnValue('/tmp')
  };
});

describe('QueueService Tests', () => {
  let mockPdfGeneratorService: jest.Mocked<PdfGeneratorService>;
  let mockStorageService: jest.Mocked<StorageService>;
  let mockUserDocumentService: jest.Mocked<UserDocumentService>;
  
  const mockDocument = {
    id: 'doc123',
    document_id: 12345,
    legal_form_id: 'form123',
    client_id: 'client123',
    status: DocumentStatus.GENERATING,
    generated_html: '<html><body>Test Document</body></html>',
    file: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPdfGeneratorService = new PdfGeneratorService() as jest.Mocked<PdfGeneratorService>;
    mockStorageService = new StorageService() as jest.Mocked<StorageService>;
    mockUserDocumentService = new UserDocumentService() as jest.Mocked<UserDocumentService>;
    
    (Bull as jest.Mock).mockImplementation(() => ({
      add: jest.fn().mockResolvedValue({ id: 'job123' }),
      process: jest.fn(),
      getJob: jest.fn().mockResolvedValue({
        id: 'job123',
        getState: jest.fn().mockResolvedValue('completed'),
        progress: jest.fn().mockResolvedValue(100),
        returnvalue: { success: true, fileUrl: 'https://example.com/file.pdf' }
      }),
      getFailed: jest.fn().mockResolvedValue([{ remove: jest.fn() }]),
      on: jest.fn()
    }));
    
    mockPdfGeneratorService.generatePdf = jest.fn().mockResolvedValue('/tmp/generated.pdf');
    
    mockStorageService.uploadFile = jest.fn().mockResolvedValue('https://storage.googleapis.com/bucket/path/to/file.pdf');
    
    mockUserDocumentService.getUserDocumentByDocumentId = jest.fn().mockResolvedValue(mockDocument);
    mockUserDocumentService.changeUserDocumentStatus = jest.fn().mockResolvedValue({
      ...mockDocument,
      status: DocumentStatus.COMPLETED
    });
    mockUserDocumentService.updateUserDocument = jest.fn().mockResolvedValue({
      ...mockDocument,
      file: ['https://storage.googleapis.com/bucket/path/to/file.pdf']
    });
  });

  describe('addPdfGenerationJob', () => {
    it('should add a job to the queue and return job ID', async () => {
      const result = await QueueService.addPdfGenerationJob(12345, '<html>Test</html>');
      
      expect(result).toBe('job123');
      expect(pdfQueue.add).toHaveBeenCalledWith(
        { document_id: 12345, html: '<html>Test</html>' },
        expect.objectContaining({
          attempts: 3,
          backoff: expect.objectContaining({
            type: 'exponential',
            delay: 5000
          }),
          removeOnComplete: true,
          removeOnFail: false
        })
      );
    });
  });

  describe('getPdfGenerationJobStatus', () => {
    it('should return job status', async () => {
      const result = await QueueService.getPdfGenerationJobStatus('job123');
      
      expect(result).toEqual({
        id: 'job123',
        status: 'completed',
        progress: 100,
        result: { success: true, fileUrl: 'https://example.com/file.pdf' }
      });
      expect(pdfQueue.getJob).toHaveBeenCalledWith('job123');
    });

    it('should return not_found status if job does not exist', async () => {
      (pdfQueue.getJob as jest.Mock).mockResolvedValue(null);
      
      const result = await QueueService.getPdfGenerationJobStatus('job456');
      
      expect(result).toEqual({ status: 'not_found' });
    });
  });

  describe('cleanupFailedJobs', () => {
    it('should remove all failed jobs', async () => {
      await QueueService.cleanupFailedJobs();
      
      expect(pdfQueue.getFailed).toHaveBeenCalled();
      const failedJobs = await pdfQueue.getFailed();
      expect(failedJobs[0].remove).toHaveBeenCalled();
    });
  });

  describe('PDF generation process', () => {
    it('should process a PDF generation job successfully', async () => {
      const processCallback = (pdfQueue.process as jest.Mock).mock.calls[0][0];
      
      const mockJob = {
        data: {
          document_id: 12345,
          html: '<html>Test</html>'
        }
      };
      
      const result = await processCallback(mockJob);
      
      expect(result).toEqual({
        success: true,
        fileUrl: 'https://storage.googleapis.com/bucket/path/to/file.pdf'
      });
      
      expect(mockPdfGeneratorService.generatePdf).toHaveBeenCalledWith(
        '<html>Test</html>',
        expect.any(String)
      );
      
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        expect.any(String),
        'legal-forms/documents/12345.pdf'
      );
      
      expect(mockUserDocumentService.changeUserDocumentStatus).toHaveBeenCalledWith(
        12345,
        DocumentStatus.COMPLETED
      );
      
      expect(mockUserDocumentService.updateUserDocument).toHaveBeenCalledWith(
        'doc123',
        {
          file: ['https://storage.googleapis.com/bucket/path/to/file.pdf']
        }
      );
    });

    it('should handle errors during PDF generation', async () => {
      mockPdfGeneratorService.generatePdf = jest.fn().mockRejectedValue(new Error('PDF generation failed'));
      
      const processCallback = (pdfQueue.process as jest.Mock).mock.calls[0][0];
      
      const mockJob = {
        data: {
          document_id: 12345,
          html: '<html>Test</html>'
        }
      };
      
      const result = await processCallback(mockJob);
      
      expect(result).toEqual({
        success: false,
        error: 'PDF generation failed'
      });
      
      expect(mockUserDocumentService.changeUserDocumentStatus).not.toHaveBeenCalled();
    });
  });
});
