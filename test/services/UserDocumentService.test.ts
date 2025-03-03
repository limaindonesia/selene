import { UserDocumentService } from "../../src/services/UserDocumentService";
import { LegalFormService } from "../../src/services/LegalFormService";
import { LegalFormStatus } from "../../src/enums/LegalFormStatus.enum";
import { DocumentStatus } from "../../src/enums/DocumentStatus.enum";

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

const userDocService = new UserDocumentService();
const legalFormService = new LegalFormService();

describe("UserDocument Service", () => {
  let legalFormId: string;
  
  jest.setTimeout(30000);
  
  beforeAll(async () => {
    await userDocService.deleteAllUserDocuments();
    
    const legalForm = await legalFormService.createLegalForm({
      name: "Test Form",
      category: "Test Category",
      description: "Test Description",
      status: LegalFormStatus.SHOW,
      price: "100000",
      final_price: "75000",
      picture_url: "https://example.com/image.jpg",
      template_doc_id: "template1"
    });
    legalFormId = legalForm.id;
  });
  
  beforeEach(async () => {
    await userDocService.deleteAllUserDocuments();
  });

  // Individual test cases from HEAD branch
  it("should create a document with input", async () => {
    const document = await userDocService.createDocumentAndInput({
      client_id: 1,
      legal_form_id: legalFormId,
      status: DocumentStatus.BOOKED,
      input: [{ field1: "value1" }]
    });

    expect(document.id).toBeDefined();
    expect(document.client_id).toBe(1);
    expect(document.legal_form_id).toBe(legalFormId);
  });

  it("should create a document with numeric client_id", async () => {
    const document = await userDocService.createDocumentAndInput({
      client_id: 123,
      legal_form_id: legalFormId,
      status: DocumentStatus.BOOKED,
      input: [{ field1: "value1" }]
    });

    expect(document.id).toBeDefined();
    expect(document.client_id).toBe(123);
    expect(document.legal_form_id).toBe(legalFormId);
  });

  it("should get paginated user documents with legal form details", async () => {
    await userDocService.createDocumentAndInput({
      client_id: 1,
      legal_form_id: legalFormId,
      status: DocumentStatus.BOOKED,
      input: [{ field1: "value1" }]
    });

    await userDocService.createDocumentAndInput({
      client_id: 2,
      legal_form_id: legalFormId,
      status: DocumentStatus.ON_PROGRESS,
      input: [{ field1: "value2" }]
    });

    const allResult = await userDocService.getAllUserDocuments(1, 10);
    expect(allResult.pagination?.total).toBe(2);
    expect(allResult.pagination?.count).toBe(2);
    expect(allResult.data.length).toBe(2);
    expect(allResult.pagination?.per_page).toBe(10);
    expect(allResult.pagination?.current_page).toBe(1);
    expect(allResult.pagination?.total_pages).toBe(1);
    
    const bookedResult = await userDocService.getAllUserDocuments(1, 10, [DocumentStatus.BOOKED]);
    expect(bookedResult.pagination?.total).toBe(1);
    expect(bookedResult.data.length).toBe(1);
    expect(bookedResult.data[0].status).toBe(DocumentStatus.BOOKED);
    
    const multiStatusResult = await userDocService.getAllUserDocuments(1, 10, [DocumentStatus.BOOKED, DocumentStatus.ON_PROGRESS]);
    expect(multiStatusResult.pagination?.total).toBe(2);
    expect(multiStatusResult.data.length).toBe(2);
    expect(multiStatusResult.data.map(d => d.status)).toEqual(
      expect.arrayContaining([DocumentStatus.BOOKED, DocumentStatus.ON_PROGRESS])
    );

    const document = allResult.data[0];
    expect(document.legal_form).toBeDefined();
    expect(typeof document.legal_form?.price).toBe('number');
    expect(typeof document.legal_form?.final_price).toBe('number');
  });

  it("should filter documents by client_id", async () => {
    await userDocService.createDocumentAndInput({
      client_id: 501,
      legal_form_id: legalFormId,
      status: DocumentStatus.BOOKED,
      input: [{ field1: "value1" }]
    });

    await userDocService.createDocumentAndInput({
      client_id: 502,
      legal_form_id: legalFormId,
      status: DocumentStatus.ON_PROGRESS,
      input: [{ field1: "value2" }]
    });

    const client1Result = await userDocService.getAllUserDocuments(1, 10, undefined, 501);
    expect(client1Result.pagination?.total).toBe(1);
    expect(client1Result.data.length).toBe(1);
    expect(client1Result.data[0].client_id).toBe(501);

    const client2Result = await userDocService.getAllUserDocuments(1, 10, undefined, 502);
    expect(client2Result.pagination?.total).toBe(1);
    expect(client2Result.data.length).toBe(1);
    expect(client2Result.data[0].client_id).toBe(502);

    const combinedFilters = await userDocService.getAllUserDocuments(1, 10, [DocumentStatus.BOOKED], 501);
    expect(combinedFilters.pagination?.total).toBe(1);
    expect(combinedFilters.data.length).toBe(1);
    expect(combinedFilters.data[0].client_id).toBe(501);
    expect(combinedFilters.data[0].status).toBe(DocumentStatus.BOOKED);
  });

  it("should handle empty results", async () => {
    await userDocService.deleteAllUserDocuments();
    
    const result = await userDocService.getAllUserDocuments(1, 10);
    expect(result.pagination?.total).toBe(0);
    expect(result.pagination?.total_pages).toBe(0);
    expect(result.data).toHaveLength(0);
  });

  it("should change document status", async () => {
    jest.setTimeout(10000); // Increase timeout to 10 seconds
    const document = await userDocService.createDocumentAndInput({
      client_id: 1,
      legal_form_id: legalFormId,
      status: DocumentStatus.BOOKED,
      input: [{ field1: "value1" }]
    });

    const updatedDocument = await userDocService.changeUserDocumentStatus(
      document.id,
      DocumentStatus.ON_PROGRESS
    );

    expect(updatedDocument).toBeDefined();
    expect(updatedDocument?.status).toBe(DocumentStatus.ON_PROGRESS);
  });

  describe.each([
    ["Test 1: Create document with input", async () => {
      await userDocService.deleteAllUserDocuments();
      
      const document = await userDocService.createDocumentAndInput({
        client_id: 101,
        legal_form_id: legalFormId,
        status: DocumentStatus.BOOKED,
        input: [{ field1: "value1" }]
      });

      expect(document.id).toBeDefined();
      expect(document.client_id).toBe(101);
      expect(document.legal_form_id).toBe(legalFormId);
    }],
    
    ["Test 2: Get paginated user documents with legal form details", async () => {
      await userDocService.deleteAllUserDocuments();
      
      await userDocService.createDocumentAndInput({
        client_id: 201,
        legal_form_id: legalFormId,
        status: DocumentStatus.BOOKED,
        input: [{ field1: "value1" }]
      });

      await userDocService.createDocumentAndInput({
        client_id: 202,
        legal_form_id: legalFormId,
        status: DocumentStatus.ON_PROGRESS,
        input: [{ field1: "value2" }]
      });

      const allResult = await userDocService.getAllUserDocuments(1, 10);
      expect(allResult.pagination?.total).toBe(2);
      expect(allResult.pagination?.count).toBe(2);
      expect(allResult.data.length).toBe(2);
      expect(allResult.pagination?.per_page).toBe(10);
      expect(allResult.pagination?.current_page).toBe(1);
      expect(allResult.pagination?.total_pages).toBe(1);
      
      const bookedResult = await userDocService.getAllUserDocuments(1, 10, [DocumentStatus.BOOKED]);
      expect(bookedResult.pagination?.total).toBe(1);
      expect(bookedResult.data.length).toBe(1);
      expect(bookedResult.data[0].status).toBe(DocumentStatus.BOOKED);
      
      const multiStatusResult = await userDocService.getAllUserDocuments(1, 10, [DocumentStatus.BOOKED, DocumentStatus.ON_PROGRESS]);
      expect(multiStatusResult.pagination?.total).toBe(2);
      expect(multiStatusResult.data.length).toBe(2);
      expect(multiStatusResult.data.map(d => d.status)).toEqual(
        expect.arrayContaining([DocumentStatus.BOOKED, DocumentStatus.ON_PROGRESS])
      );

      const document = allResult.data[0];
      expect(document.legal_form).toBeDefined();
      expect(typeof document.legal_form?.price).toBe('number');
      expect(typeof document.legal_form?.final_price).toBe('number');
    }],
    
    ["Test 3: Handle empty results", async () => {
      await userDocService.deleteAllUserDocuments();
      
      const result = await userDocService.getAllUserDocuments(1, 10);
      expect(result.pagination?.total).toBe(0);
      expect(result.pagination?.total_pages).toBe(0);
      expect(result.data).toHaveLength(0);
    }],
    
    ["Test 4: Return non-paginated results when pageSize is not provided", async () => {
      await userDocService.deleteAllUserDocuments();
      
      await userDocService.createDocumentAndInput({
        client_id: 301,
        legal_form_id: legalFormId,
        status: DocumentStatus.BOOKED,
        input: [{ field1: "value1" }]
      });

      const result = await userDocService.getAllUserDocuments(undefined, undefined);
      expect(result.data).toBeDefined();
      expect(result.pagination).toBeUndefined();
    }],
    
    ["Test 5: Change document status", async () => {
      await userDocService.deleteAllUserDocuments();
      
      const document = await userDocService.createDocumentAndInput({
        client_id: 401,
        legal_form_id: legalFormId,
        status: DocumentStatus.BOOKED,
        input: [{ field1: "value1" }]
      });

      const updatedDocument = await userDocService.changeUserDocumentStatus(
        document.id,
        DocumentStatus.ON_PROGRESS
      );

      expect(updatedDocument).toBeDefined();
      expect(updatedDocument?.status).toBe(DocumentStatus.ON_PROGRESS);
    }]
  ])("%s", (testName, testFn) => {
    it("runs test", testFn);
  });
});
