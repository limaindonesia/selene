import { UserDocumentResolver } from '../../src/resolvers/UserDocumentResolver';
import { UserDocumentService } from '../../src/services/UserDocumentService';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { Request, Response } from 'express';

// Mock the Context interface to make it easier to test
jest.mock('../../src/resolvers/UserDocumentResolver', () => {
  const original = jest.requireActual('../../src/resolvers/UserDocumentResolver');
  return {
    ...original,
    Context: {
      req: {},
      res: {},
      clientId: ''
    }
  };
});

const writeFileAsync = promisify(fs.writeFile);
const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);
const unlinkAsync = promisify(fs.unlink);

// Moc
jest.mock('type-graphql', () => ({
  ObjectType: () => jest.fn(),
  Field: () => jest.fn(),
  ID: Symbol('ID'),
  InputType: () => jest.fn(),
  Int: Symbol('Int'),
  Float: Symbol('Float'),
  Resolver: () => jest.fn(),
  Query: () => jest.fn(),
  Mutation: () => jest.fn(),
  Arg: () => jest.fn(),
  Ctx: () => jest.fn()
}));

jest.mock('../../src/schemas/LegalFormSchema', () => ({
  LegalForm: class LegalForm {
    id = 'form123';
    name = 'Test Form';
    price = 100;
    final_price = 80;
    description = 'Test Description';
    picture_url = 'https://example.com/image.jpg';
    category = 'Test Category';
    rating = 4.5;
    total_created = 100;
  }
}));

jest.mock('../../src/config/envConfig', () => ({
  __esModule: true,
  default: {
    app_env: 'DEV',
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

jest.mock('../../src/services/UserDocumentService', () => {
  return {
    UserDocumentService: jest.fn().mockImplementation(() => ({
      getUserDocumentByDocumentId: jest.fn().mockImplementation((document_id) => {
        if (document_id === 12345) {
          return Promise.resolve({
            id: 'mock-document-id',
            document_id: 12345,
            client_id: 123,
            status: 1
          });
        }
        return Promise.resolve(null);
      }),
      generateDocument: jest.fn().mockResolvedValue('job123'),
      regenerateDocument: jest.fn().mockResolvedValue('job123'),
      getJobStatus: jest.fn().mockResolvedValue({
        status: 'completed',
        progress: 100,
        result: { success: true, fileUrl: 'file:///path/to/file.pdf' }
      }),
      downloadDocument: jest.fn().mockImplementation(async () => {
        const testDir = path.join(process.cwd(), 'storage', 'local', 'test');
        await mkdirAsync(testDir, { recursive: true });
        const testFile = path.join(testDir, 'test-download.pdf');
        await writeFileAsync(testFile, 'Test PDF content');
        // Return a file path string to test that code path
        return testFile;
      }),
      getDocumentStream: jest.fn().mockImplementation(() => {
        const testDir = path.join(process.cwd(), 'storage', 'local', 'test');
        const testFile = path.join(testDir, 'test-stream.pdf');
        writeFileAsync(testFile, 'Test PDF content').catch(console.error);
        return fs.createReadStream(testFile);
      })
    }))
  };
});

jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    createReadStream: jest.fn().mockImplementation((path) => {
      const stream = originalFs.createReadStream(path);
      stream.pipe = jest.fn().mockReturnValue(stream);
      return stream;
    })
  };
});

describe('UserDocumentResolver with Local Storage', () => {
  let resolver: UserDocumentResolver;
  let mockUserDocumentService: jest.Mocked<UserDocumentService>;
  
  const mockRequest = {
    headers: {
      'user-agent': 'Mozilla/5.0'
    }
  } as any;

  const mockResponse = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    req: mockRequest
  };

  const testDir = path.join(process.cwd(), 'storage', 'local', 'test');

  beforeAll(async () => {
    await mkdirAsync(testDir, { recursive: true });
  });

  afterAll(async () => {
    const testDownloadFile = path.join(testDir, 'test-download.pdf');
    const testStreamFile = path.join(testDir, 'test-stream.pdf');
    
    if (await existsAsync(testDownloadFile)) {
      await unlinkAsync(testDownloadFile);
    }
    
    if (await existsAsync(testStreamFile)) {
      await unlinkAsync(testStreamFile);
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUserDocumentService = new UserDocumentService() as jest.Mocked<UserDocumentService>;
    
    resolver = new UserDocumentResolver();
    (resolver as any).service = mockUserDocumentService;
  });

  describe('generateDocument', () => {
    it('should generate a document and return success response', async () => {
      mockUserDocumentService.getUserDocumentById = jest.fn().mockResolvedValue({
        id: 'mock-document-id',
        document_id: 12345,
        client_id: 123,
        status: 1
      });
      
      const result = await resolver.generateDocument('mock-document-id', '<html>Test</html>', { req: {} as any, res: {}, clientId: '123' } as any);
      
      expect(result).toEqual({
        success: true,
        message: 'Document generation started',
        data: {
          id: 'mock-document-id',
          job_id: 'job123',
          status: 'processing'
        }
      });
      expect(mockUserDocumentService.getUserDocumentById).toHaveBeenCalledWith('mock-document-id');
      expect(mockUserDocumentService.generateDocument).toHaveBeenCalledWith(
        'mock-document-id',
        '<html>Test</html>'
      );
    });

    it('should handle errors and return failure response', async () => {
      mockUserDocumentService.getUserDocumentById = jest.fn().mockResolvedValue({
        id: 'mock-document-id',
        document_id: 99999,
        client_id: 123,
        status: 1
      });
      mockUserDocumentService.generateDocument = jest.fn().mockRejectedValue(
        new Error('Document not found')
      );
      
      const result = await resolver.generateDocument('mock-document-id', '<html>Test</html>', { clientId: '123' } as any);
      
      expect(result).toEqual({
        success: false,
        message: 'Document not found',
        data: {
          id: 'mock-document-id',
          status: 'failed'
        }
      });
    });

    it('should handle missing client_id', async () => {
      const result = await resolver.generateDocument('mock-document-id', '<html>Test</html>', { clientId: '' } as any);
      
      expect(result).toEqual({
        success: false,
        message: 'Missing required header: client_id',
        data: {
          id: 'mock-document-id',
          status: 'failed'
        }
      });
      expect(mockUserDocumentService.generateDocument).not.toHaveBeenCalled();
    });
  });

  describe('regenerateDocument', () => {
    it('should regenerate a document and return success response', async () => {
      mockUserDocumentService.getUserDocumentById = jest.fn().mockResolvedValue({
        id: 'mock-document-id',
        document_id: 12345,
        client_id: 123,
        status: 1
      });
      
      const result = await resolver.regenerateDocument('mock-document-id', { req: {} as any, res: {}, clientId: '123' } as any);
      
      expect(result).toEqual({
        success: true,
        message: 'Document regeneration started',
        data: {
          id: 'mock-document-id',
          job_id: 'job123',
          status: 'processing'
        }
      });
      expect(mockUserDocumentService.getUserDocumentById).toHaveBeenCalledWith('mock-document-id');
      expect(mockUserDocumentService.regenerateDocument).toHaveBeenCalledWith('mock-document-id');
    });
  });

  describe('getDocumentJobStatus', () => {
    it('should return job status with local file URL', async () => {
      const result = await resolver.getDocumentJobStatus('job123', { req: {} as any, res: {}, clientId: 'client123' } as any);
      
      expect(result).toEqual({
        success: true,
        data: {
          job_id: 'job123',
          status: 'completed',
          progress: 100,
          result: { success: true, fileUrl: 'file:///path/to/file.pdf' }
        }
      });
      expect(mockUserDocumentService.getJobStatus).toHaveBeenCalledWith('job123');
      
      expect(result.data?.result.fileUrl).toMatch(/^file:\/\//);
    });
  });

  describe('downloadDocument', () => {
    it('should download a document from local storage', async () => {
      mockUserDocumentService.getUserDocumentById = jest.fn().mockResolvedValue({
        id: 'mock-document-id',
        document_id: 12345,
        client_id: 123,
        status: 1
      });
      
      const result = await resolver.downloadDocument('mock-document-id', { 
        req: {} as any,
        res: mockResponse as any,
        clientId: '123'
      });
      
      expect(result).toBe(true);
      expect(mockUserDocumentService.getUserDocumentById).toHaveBeenCalledWith('mock-document-id');
      expect(mockUserDocumentService.downloadDocument).toHaveBeenCalledWith('mock-document-id');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="document-12345.pdf"'
      );
      
      // Verify that fs.createReadStream was called with a local file path
      expect(fs.createReadStream).toHaveBeenCalledWith(
        expect.stringContaining(path.join('storage', 'local', 'test'))
      );
    });
  });

  describe('streamDocument', () => {
    it('should stream a document from local storage', async () => {
      mockUserDocumentService.getUserDocumentById = jest.fn().mockResolvedValue({
        id: 'mock-document-id',
        document_id: 12345,
        client_id: 123,
        status: 1
      });
      
      const result = await resolver.streamDocument('mock-document-id', { 
        req: mockRequest,
        res: mockResponse as any,
        clientId: '123'
      });
      
      expect(result).toBe(true);
      expect(mockUserDocumentService.getUserDocumentById).toHaveBeenCalledWith('mock-document-id');
      expect(mockUserDocumentService.getDocumentStream).toHaveBeenCalledWith('mock-document-id');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'inline; filename="document-12345.pdf"'
      );
    });

    it('should handle mobile user agents with local storage', async () => {
      mockUserDocumentService.getUserDocumentById = jest.fn().mockResolvedValue({
        id: 'mock-document-id',
        document_id: 12345,
        client_id: 123,
        status: 1
      });
      
      const mobileResponse = {
        ...mockResponse,
        req: {
          headers: {
            'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
          }
        }
      };
      
      const result = await resolver.streamDocument('mock-document-id', { 
        req: {} as any,
        res: mobileResponse as any,
        clientId: '123'
      });
      
      expect(result).toBe(true);
      expect(mockUserDocumentService.getUserDocumentById).toHaveBeenCalledWith('mock-document-id');
      expect(mobileResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
      expect(mobileResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="document-12345.pdf"'
      );
    });
  });
});
