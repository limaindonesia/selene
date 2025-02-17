import { UserDocumentService } from "../../src/services/UserDocumentService";
import { LegalFormService } from "../../src/services/LegalFormService";
import { LegalFormStatus } from "../../src/enums/LegalFormStatus.enum";
import { DocumentStatus } from "../../src/enums/DocumentStatus.enum";

const userDocService = new UserDocumentService();
const legalFormService = new LegalFormService();

describe("UserDocument Service", () => {
  let legalFormId: string;

  beforeAll(async () => {
    const legalForm = await legalFormService.createLegalForm({
      name: "Test Form",
      category: "Test Category",
      description: "Test Description",
      status: LegalFormStatus.SHOW,
      price: 100000,
      final_price: 75000,
      picture_url: "https://example.com/image.jpg",
      template_doc_id: "template1"
    });
    legalFormId = legalForm.id;
  });

  beforeEach(async () => {
    await userDocService.deleteAllUserDocuments();
  });

  it("should create a document with input", async () => {
    const document = await userDocService.createDocumentAndInput({
      client_id: "client1",
      legal_form_id: legalFormId,
      status: DocumentStatus.BOOKED,
      input: [{ field1: "value1" }]
    });

    expect(document._id).toBeDefined();
    expect(document.client_id).toBe("client1");
    expect(document.legal_form_id).toBe(legalFormId);
  });

  it("should get paginated user documents with legal form details", async () => {
    await userDocService.createDocumentAndInput({
      client_id: "client1",
      legal_form_id: legalFormId,
      status: DocumentStatus.BOOKED,
      input: [{ field1: "value1" }]
    });

    await userDocService.createDocumentAndInput({
      client_id: "client2",
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
    
    const bookedResult = await userDocService.getAllUserDocuments(1, 10, ['BOOKED']);
    expect(bookedResult.pagination?.total).toBe(1);
    expect(bookedResult.data.length).toBe(1);
    expect(bookedResult.data[0].status).toBe(DocumentStatus.BOOKED);
    
    const multiStatusResult = await userDocService.getAllUserDocuments(1, 10, ['BOOKED', 'ON_PROGRESS']);
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

  it("should handle empty results", async () => {
    await userDocService.deleteAllUserDocuments();
    
    const result = await userDocService.getAllUserDocuments(1, 10);
    expect(result.pagination?.total).toBe(0);
    expect(result.pagination?.total_pages).toBe(0);
    expect(result.data).toHaveLength(0);
  });

  it("should return non-paginated results when pageSize is not provided", async () => {
    await userDocService.createDocumentAndInput({
      client_id: "client1",
      legal_form_id: legalFormId,
      status: DocumentStatus.BOOKED,
      input: [{ field1: "value1" }]
    });

    const result = await userDocService.getAllUserDocuments(undefined, undefined);
    expect(result.data).toBeDefined();
    expect(result.pagination).toBeUndefined();
  });

  it("should change document status", async () => {
    const document = await userDocService.createDocumentAndInput({
      client_id: "client1",
      legal_form_id: legalFormId,
      status: DocumentStatus.BOOKED,
      input: [{ field1: "value1" }]
    });

    const updatedDocument = await userDocService.changeUserDocumentStatus(
      document.document_id,
      DocumentStatus.ON_PROGRESS
    );

    expect(updatedDocument).toBeDefined();
    expect(updatedDocument?.status).toBe(DocumentStatus.ON_PROGRESS);
  });
});
