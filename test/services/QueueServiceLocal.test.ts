import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { DocumentStatus } from '../../src/enums/DocumentStatus.enum';
import { QueueService, pdfQueue } from '../../src/services/QueueService';

const existsAsync = promisify(fs.exists);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

jest.mock('bull', () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job123' }),
    process: jest.fn((callback) => {
      (global as any).processCallback = callback;
    }),
    getJob: jest.fn().mockResolvedValue({
      id: 'job123',
      getState: jest.fn().mockResolvedValue('completed'),
      progress: jest.fn().mockResolvedValue(100),
      returnvalue: { success: true, fileUrl: 'file:///path/to/file.pdf' }
    }),
    getFailed: jest.fn().mockResolvedValue([{ remove: jest.fn() }]),
    on: jest.fn()
  }));
});

jest.mock('../../src/config/envConfig', () => ({
  __esModule: true,
  default: {
    app_env: 'DEV',
    port: '5000',
    log_transport: 'FILE',
    mongodb1: {
      uri: 'mongodb://localhost:27017',
      database: 'perqara',
      username: 'root',
      password: '',
    },
    mongodb2: {
      uri: 'mongodb://localhost:27017',
      database: 'legal_form',
      username: 'root',
      password: '',
    },
    redis: {
      host: 'localhost',
      port: 6379,
      password: '',
    },
    gcs: {
      projectId: '',
      keyFilename: '',
      bucket: '',
      pathPrefix: '',
      bucketPublic: '',
      pathPrefixPublic: '',
    }
  }
}));

jest.mock('../../src/services/PdfGeneratorService', () => {
  return {
    PdfGeneratorService: jest.fn().mockImplementation(() => ({
      generatePdf: jest.fn().mockImplementation(async (html, outputPath) => {
        await promisify(fs.writeFile)(outputPath, 'Mock PDF content');
        return outputPath;
      })
    }))
  };
});

jest.mock('../../src/services/UserDocumentService', () => {
  return {
    UserDocumentService: jest.fn().mockImplementation(() => ({
      getUserDocumentById: jest.fn().mockResolvedValue({
        id: 'doc123',
        document_id: 12345,
        status: DocumentStatus.GENERATING,
        generated_html: '<html><body>Test Document</body></html>'
      }),
      getUserDocumentByDocumentId: jest.fn().mockResolvedValue({
        id: 'doc123',
        document_id: 12345,
        status: DocumentStatus.GENERATING,
        generated_html: '<html><body>Test Document</body></html>'
      }),
      changeUserDocumentStatus: jest.fn().mockResolvedValue({
        id: 'doc123',
        document_id: 12345,
        status: DocumentStatus.COMPLETED
      }),
      updateUserDocument: jest.fn().mockResolvedValue({
        id: 'doc123',
        document_id: 12345,
        file: ['file:///path/to/file.pdf']
      })
    }))
  };
});

describe('QueueService with Local Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addPdfGenerationJob', () => {
    it('should add a job to the queue and return job ID', async () => {
      const result = await QueueService.addPdfGenerationJob('12345', '<html>Test</html>');
      
      expect(result).toBe('job123');
      expect(pdfQueue.add).toHaveBeenCalledWith(
        { id: '12345', html: '<html>Test</html>' },
        expect.objectContaining({
          attempts: 3,
          backoff: expect.objectContaining({
            type: 'exponential',
            delay: 5000
          }),
          removeOnComplete: false,
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
        result: { success: true, fileUrl: 'file:///path/to/file.pdf' }
      });
      expect(pdfQueue.getJob).toHaveBeenCalledWith('job123');
    });

    it('should return not_found status if job does not exist', async () => {
      (pdfQueue.getJob as jest.Mock).mockResolvedValue(null);
      
      const result = await QueueService.getPdfGenerationJobStatus('job456');
      
      expect(result).toEqual({ status: 'not_found' });
    });
  });

  describe('PDF generation process', () => {
    it('should process a PDF generation job with local storage', async () => {
      const processCallback = (global as any).processCallback;
      
      const mockJob = {
        data: {
          id: '12345',
          html: '<html><body>Test Document</body></html>'
        }
      };
      
      const result = await processCallback(mockJob);
      
      expect(result).toEqual({
        success: true,
        fileUrl: expect.stringContaining('file://')
      });
      
      expect(result.fileUrl).toMatch(/^file:\/\//);
      
      const filePath = result.fileUrl.replace('file://', '');
      
      const localStoragePath = path.join(process.cwd(), 'storage', 'local');
      expect(filePath).toContain(localStoragePath);
    });
  });
});
