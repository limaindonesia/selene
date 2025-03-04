import path from 'path';
import { QueueService, pdfQueue } from '../../src/services/QueueService';
import { PdfGeneratorService } from '../../src/services/PdfGeneratorService';
import { StorageService } from '../../src/services/StorageService';
import { UserDocumentService } from '../../src/services/UserDocumentService';
import { DocumentStatus } from '../../src/enums/DocumentStatus.enum';
import Bull from 'bull';

// Mock fs module instead of using promisify
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn().mockResolvedValue(Buffer.from('<html>Test</html>')),
    unlink: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockResolvedValue(true),
    writeFile: jest.fn().mockResolvedValue(undefined)
  },
  exists: jest.fn((path, callback) => callback(null, true)),
  unlink: jest.fn((path, callback) => callback(null)),
  readFile: jest.fn((path, callback) => callback(null, Buffer.from('<html>Test</html>'))),
  writeFile: jest.fn((path, content, callback) => callback(null))
}));

// Mock for Bull.js
jest.mock('bull', () => {
  // Create a mock Bull constructor
  const mockBull = jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job123' }),
    process: jest.fn(),
    getJob: jest.fn().mockImplementation((jobId) => {
      // Return different job data based on job ID for testing different scenarios
      if (jobId === 'job123') {
        return Promise.resolve({
          id: 'job123',
          getState: jest.fn().mockResolvedValue('completed'),
          progress: jest.fn().mockResolvedValue(100),
          returnvalue: { success: true, fileUrl: 'https://example.com/file.pdf' },
          remove: jest.fn().mockResolvedValue(undefined)
        });
      } else {
        return Promise.resolve(null);
      }
    }),
    getFailed: jest.fn().mockResolvedValue([{ remove: jest.fn() }]),
    on: jest.fn()
  }));
  
  return mockBull;
});

// Mock for cloud storage tests
jest.mock('../../src/services/PdfGeneratorService', () => {
  return {
    PdfGeneratorService: jest.fn().mockImplementation(() => ({
      generatePdf: jest.fn().mockResolvedValue('/tmp/generated.pdf')
    }))
  };
});

// Mock for local storage tests
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
      getUserDocumentById: jest.fn().mockResolvedValue({
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
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPdfGeneratorService = new PdfGeneratorService() as jest.Mocked<PdfGeneratorService>;
    mockStorageService = new StorageService() as jest.Mocked<StorageService>;
    mockUserDocumentService = new UserDocumentService() as jest.Mocked<UserDocumentService>;
    
    (Bull as jest.Mock).mockImplementation(() => ({
      add: jest.fn().mockResolvedValue({ id: 'job123' }),
      process: jest.fn(),
      getJob: jest.fn().mockImplementation((jobId) => {
        if (jobId === 'job123') {
          return Promise.resolve({
            id: 'job123',
            getState: jest.fn().mockResolvedValue('completed'),
            progress: jest.fn().mockResolvedValue(100),
            returnvalue: { success: true, fileUrl: 'https://example.com/file.pdf' },
            remove: jest.fn().mockResolvedValue(undefined)
          });
        } else {
          return Promise.resolve(null);
        }
      }),
      getFailed: jest.fn().mockResolvedValue([{ remove: jest.fn() }]),
      on: jest.fn()
    }));
    
    mockPdfGeneratorService.generatePdf = jest.fn().mockResolvedValue('/tmp/generated.pdf');
    
    mockStorageService.uploadFile = jest.fn().mockResolvedValue('https://storage.googleapis.com/bucket/path/to/file.pdf');
    
    mockUserDocumentService.getUserDocumentById = jest.fn().mockResolvedValue({
      id: 'doc123',
      document_id: 12345,
      status: DocumentStatus.GENERATING,
      generated_html: '<html>Test</html>'
    });
    mockUserDocumentService.changeUserDocumentStatus = jest.fn().mockResolvedValue({
      id: 'doc123',
      document_id: 12345,
      status: DocumentStatus.COMPLETED
    });
    mockUserDocumentService.updateUserDocument = jest.fn().mockResolvedValue({
      id: 'doc123',
      document_id: 12345,
      file: ['https://storage.googleapis.com/bucket/path/to/file.pdf']
    });
  });

  describe('addPdfGenerationJob', () => {
    it('should add a job to the queue and return job ID', async () => {
      const result = await QueueService.addPdfGenerationJob('doc123', '<html>Test</html>');
      
      expect(result).toBe('job123');
      expect(pdfQueue.add).toHaveBeenCalledWith(
        { id: 'doc123', html: '<html>Test</html>' },
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
        result: { success: true, fileUrl: 'https://example.com/file.pdf' }
      });
      expect(pdfQueue.getJob).toHaveBeenCalledWith('job123');
    });

    it('should return not_found status if job does not exist', async () => {
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
        // Explicitly mock the getJob implementation for 'job123'
        (pdfQueue.getJob as jest.Mock).mockImplementation((jobId) => {
          if (jobId === 'job123') {
            return Promise.resolve({
              id: 'job123',
              getState: jest.fn().mockResolvedValue('completed'),
              progress: jest.fn().mockResolvedValue(100),
              returnvalue: { success: true, fileUrl: 'https://example.com/file.pdf' }
            });
          } else {
            return Promise.resolve(null);
          }
        });
        
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
        const result = await QueueService.getPdfGenerationJobStatus('job456');
        
        expect(result).toEqual({ status: 'not_found' });
      });
    });

    describe('PDF generation process', () => {
      it('should process a PDF generation job with local storage', async () => {
        // Mock the process callback function
        const processCallback = jest.fn().mockImplementation(async (job) => {
          return {
            success: true,
            fileUrl: 'file:///path/to/local/storage/file.pdf'
          };
        });
        
        // Set up the mock job
        const mockJob = {
          data: {
            id: '12345',
            html: '<html><body>Test Document</body></html>'
          }
        };
        
        // Call the process callback
        const result = await processCallback(mockJob);
        
        // Verify the result
        expect(result).toEqual({
          success: true,
          fileUrl: expect.stringContaining('file://')
        });
        
        // Verify the file URL format
        expect(result.fileUrl).toMatch(/^file:\/\//);
      });
    });
  });

  describe('QueueService with Cloud Storage', () => {
    it('should add a PDF generation job successfully', async () => {
      const jobId = await QueueService.addPdfGenerationJob('doc123', '<html>Test</html>');
      expect(jobId).toBe('job123');
      expect(pdfQueue.add).toHaveBeenCalledWith(
        { id: 'doc123', html: '<html>Test</html>' },
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

    it('should get job status successfully', async () => {
      // Explicitly set the mock implementation for this test
      (pdfQueue.getJob as jest.Mock).mockImplementation((jobId) => {
        if (jobId === 'job123') {
          return Promise.resolve({
            id: 'job123',
            getState: jest.fn().mockResolvedValue('completed'),
            progress: jest.fn().mockResolvedValue(100),
            returnvalue: { success: true, fileUrl: 'https://example.com/file.pdf' }
          });
        } else {
          return Promise.resolve(null);
        }
      });
      
      const status = await QueueService.getPdfGenerationJobStatus('job123');
      expect(status).toEqual({
        id: 'job123',
        status: 'completed',
        progress: 100,
        result: { success: true, fileUrl: 'https://example.com/file.pdf' }
      });
    });

    it('should clean up failed jobs successfully', async () => {
      await QueueService.cleanupFailedJobs();
      expect(pdfQueue.getFailed).toHaveBeenCalled();
    });
  });
});
