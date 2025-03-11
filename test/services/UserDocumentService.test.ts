import { UserDocumentService } from "../../src/services/UserDocumentService";
import { LegalFormService } from "../../src/services/LegalFormService";
import { UserDocumentRepository } from "../../src/repositories/UserDocumentRepository";
import { UserInputRepository } from "../../src/repositories/UserInputRepository";
import { LegalFormRepository } from "../../src/repositories/LegalFormRepository";
import { StorageService } from "../../src/services/StorageService";
import { PdfGeneratorService } from "../../src/services/PdfGeneratorService";
import { RedisService } from "../../src/services/RedisService";
import { LegalFormStatus } from "../../src/enums/LegalFormStatus.enum";
import { DocumentStatus } from "../../src/enums/DocumentStatus.enum";
import { IUserDocument } from "../../src/models/UserDocument";
import env from "../../src/config/envConfig";

// Mock environmental config for URL signing tests
jest.mock("../../src/config/envConfig", () => ({
  signedUrl: {
    expirationTime: 3600 // 1 hour for testing
  }
}));

// Mock all dependencies
jest.mock("../../src/repositories/UserDocumentRepository");
jest.mock("../../src/repositories/LegalFormRepository");
jest.mock("../../src/services/StorageService");
jest.mock("../../src/services/PdfGeneratorService");
jest.mock("../../src/services/RedisService");

// Import QueueService statically to avoid circular dependency
jest.mock("../../src/services/QueueService", () => ({
  QueueService: {
    addPdfGenerationJob: jest.fn().mockResolvedValue("job-123"),
    getPdfGenerationJobStatus: jest.fn().mockResolvedValue({ status: "completed" })
  }
}));

// Mock UserInputRepository for document creation tests
jest.mock("../../src/repositories/UserInputRepository", () => {
  return {
    UserInputRepository: jest.fn().mockImplementation(() => {
      return {
        getModel: jest.fn().mockResolvedValue({
          find: jest.fn().mockResolvedValue([]),
          findById: jest.fn().mockResolvedValue(null),
          findOne: jest.fn().mockResolvedValue(null),
          deleteMany: jest.fn().mockResolvedValue({}),
        }),
        create: jest.fn().mockImplementation((data) => {
          return Promise.resolve({
            ...data,
            id: 'mock-user-input-id',
            save: jest.fn().mockResolvedValue(true)
          });
        }),
        findAll: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue(null),
        delete: jest.fn().mockResolvedValue(null),
        updateByDocumentId: jest.fn().mockResolvedValue(null),
        findOneByDocumentId: jest.fn().mockResolvedValue(null),
        deleteAll: jest.fn().mockResolvedValue({}),
      };
    })
  };
});

describe("UserDocument Service", () => {
  let mockUserDocumentRepository: any;
  let mockUserInputRepository: any;
  let mockLegalFormRepository: any;
  let mockRedisService: any;
  let mockStorageService: any;
  let service: UserDocumentService;
  
  const mockLegalForm = {
    _id: "form-123",
    id: "form-123",
    name: "Test Form",
    category: "Test Category",
    description: "Test Description",
    status: LegalFormStatus.SHOW,
    price: "100000",
    original_price: "75000",
    picture_url: "https://example.com/image.jpg",
    template_doc_id: "template1",
    toObject: () => ({
      _id: "form-123",
      name: "Test Form",
      category: "Test Category",
      description: "Test Description",
      status: LegalFormStatus.SHOW,
      price: "100000",
      original_price: "75000",
      picture_url: "https://example.com/image.jpg",
      template_doc_id: "template1"
    })
  };

  const mockUserDocument = {
    _id: "doc-123",
    id: "doc-123",
    document_id: 123,
    client_id: 456,
    legal_form_id: "form-123",
    status: DocumentStatus.COMPLETED,
    is_client_rated: false,
    document_rating: 0,
    generated_at: new Date(),
    generated_html: "<html></html>",
    file: ["documents/123.pdf"],
    createdAt: new Date(),
    updatedAt: new Date(),
    toObject: () => ({
      _id: "doc-123",
      document_id: 123,
      client_id: 456,
      legal_form_id: "form-123",
      status: DocumentStatus.COMPLETED,
      is_client_rated: false,
      document_rating: 0,
      generated_at: new Date(),
      generated_html: "<html></html>",
      file: ["documents/123.pdf"],
      createdAt: new Date(),
      updatedAt: new Date()
    })
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mocks
    mockUserDocumentRepository = {
      create: jest.fn().mockResolvedValue(mockUserDocument),
      update: jest.fn().mockResolvedValue(mockUserDocument),
      findById: jest.fn().mockResolvedValue(mockUserDocument),
      findByDocumentId: jest.fn().mockResolvedValue(mockUserDocument),
      delete: jest.fn().mockResolvedValue(mockUserDocument),
      deleteAll: jest.fn().mockResolvedValue({}),
      getLastDocumentId: jest.fn().mockResolvedValue(122),
      findAllWithPagination: jest.fn().mockResolvedValue({
        data: [mockUserDocument],
        totalItems: 1,
        totalPages: 1
      }),
      countTotalDocumentCreated: jest.fn().mockRejectedValue(1)
    };
    
    mockUserInputRepository = {
      create: jest.fn().mockResolvedValue({
        id: "input-123",
        document_id: 123,
        input: { field1: "value1" }
      })
    };
    
    mockLegalFormRepository = {
      findById: jest.fn().mockResolvedValue(mockLegalForm),
      update: jest.fn().mockResolvedValue(mockLegalForm),
    };
    
    mockStorageService = {
      fileExists: jest.fn().mockResolvedValue(true),
      getFileStream: jest.fn().mockReturnValue({
        pipe: jest.fn()
      }),
      getSignedUrl: jest.fn().mockResolvedValue("https://storage.example.com/file.pdf")
    };
    
    mockRedisService = {
      getDocumentUrl: jest.fn().mockResolvedValue(null),
      storeDocumentUrl: jest.fn().mockResolvedValue(undefined)
    };
    
    // Set up mock implementations
    (UserDocumentRepository as jest.MockedClass<typeof UserDocumentRepository>)
      .mockImplementation(() => mockUserDocumentRepository);
      
    (UserInputRepository as jest.MockedClass<typeof UserInputRepository>)
      .mockImplementation(() => mockUserInputRepository);
      
    (LegalFormRepository as jest.MockedClass<typeof LegalFormRepository>)
      .mockImplementation(() => mockLegalFormRepository);
      
    (StorageService as jest.MockedClass<typeof StorageService>)
      .mockImplementation(() => mockStorageService);
      
    (RedisService as jest.MockedClass<typeof RedisService>)
      .mockImplementation(() => mockRedisService);
    
    service = new UserDocumentService();
  });

  it("should create a document with input", async () => {
    const result = await service.createDocumentAndInput({
      client_id: 456,
      legal_form_id: "form-123",
      status: DocumentStatus.BOOKED,
      input: { field1: "value1" }
    });
    
    expect(result).toBeDefined();
    expect(result.id).toBe("doc-123");
    expect(result.legal_form_id).toBe("form-123");
    expect(mockUserDocumentRepository.create).toHaveBeenCalled();
    expect(mockUserInputRepository.create).toHaveBeenCalled();
    expect(mockLegalFormRepository.findById).toHaveBeenCalledWith("form-123");
  });

  it("should create a document with numeric client_id", async () => {
    const result = await service.createDocumentAndInput({
      client_id: 123,
      legal_form_id: "form-123",
      status: DocumentStatus.BOOKED,
      input: { field1: "value1" }
    });
    
    expect(result).toBeDefined();
    expect(result.client_id).toBe(456); // From mockUserDocument
  });

  it("should get paginated user documents with legal form details", async () => {
    const result = await service.getAllUserDocuments(1, 10);
    
    expect(result).toBeDefined();
    expect(result.data).toHaveLength(1);
    expect(result.pagination).toBeDefined();
    expect(result.pagination?.total).toBe(1);
    expect(mockUserDocumentRepository.findAllWithPagination).toHaveBeenCalled();
    expect(mockLegalFormRepository.findById).toHaveBeenCalled();
  });

  it("should filter documents by client_id", async () => {
    const clientId = 456;
    await service.getAllUserDocuments(1, 10, undefined, clientId);
    
    expect(mockUserDocumentRepository.findAllWithPagination).toHaveBeenCalledWith(
      1,
      10,
      expect.objectContaining({ client_id: clientId })
    );
  });

  it("should handle empty results", async () => {
    mockUserDocumentRepository.findAllWithPagination.mockResolvedValueOnce({
      data: [],
      totalItems: 0,
      totalPages: 0
    });
    
    const result = await service.getAllUserDocuments(1, 10);
    
    expect(result).toBeDefined();
    expect(result.data).toHaveLength(0);
    expect(result.pagination?.total).toBe(0);
  });

  it("should change document status", async () => {
    mockUserDocumentRepository.countTotalDocumentCreated.mockResolvedValueOnce();
    const result = await service.changeUserDocumentStatus("doc-123", DocumentStatus.ON_PROGRESS);
    
    expect(result).toBeDefined();
    expect(mockUserDocumentRepository.update).toHaveBeenCalled();
  });

  describe("Test 1: Create document with input", () => {
    it("runs test", async () => {
      const result = await service.createDocumentAndInput({
        client_id: 456,
        legal_form_id: "form-123",
        status: DocumentStatus.BOOKED,
        input: { field1: "value1" }
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBe("doc-123");
    });
  });

  describe("Test 2: Get paginated user documents with legal form details", () => {
    it("runs test", async () => {
      const result = await service.getAllUserDocuments(1, 10);
      
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.pagination).toBeDefined();
    });
  });

  describe("Test 3: Handle empty results", () => {
    it("runs test", async () => {
      mockUserDocumentRepository.findAllWithPagination.mockResolvedValueOnce({
        data: [],
        totalItems: 0,
        totalPages: 0
      });
      
      const result = await service.getAllUserDocuments(1, 10);
      
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(0);
    });
  });

  describe("Test 4: Return non-paginated results when pageSize is not provided", () => {
    it("runs test", async () => {
      const result = await service.getAllUserDocuments(undefined, undefined);
      
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe("Test 5: Change document status", () => {
    it("runs test", async () => {

      mockUserDocumentRepository.countTotalDocumentCreated.mockResolvedValueOnce();
      const result = await service.changeUserDocumentStatus("doc-123", DocumentStatus.ON_PROGRESS);
      
      expect(result).toBeDefined();
      expect(mockUserDocumentRepository.update).toHaveBeenCalled();
    });
  });
});
