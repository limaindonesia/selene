import { LegalFormRatingService } from "../../src/services/LegalFormRatingService";
import { LegalFormRatingRepository } from "../../src/repositories/LegalFormRatingRepository";
import { UserDocumentRepository } from "../../src/repositories/UserDocumentRepository";
import { LegalFormRepository } from "../../src/repositories/LegalFormRepository";
import { IUserDocument } from "../../src/models/UserDocument";
import { ILegalFormRating } from "../../src/models/LegalFormRating";

jest.mock("../../src/repositories/LegalFormRatingRepository");
jest.mock("../../src/repositories/UserDocumentRepository");
jest.mock("../../src/repositories/LegalFormRepository");

describe("LegalFormRatingService", () => {
  let service: LegalFormRatingService;
  let mockRatingRepo: jest.Mocked<LegalFormRatingRepository>;
  let mockDocumentRepo: jest.Mocked<UserDocumentRepository>;
  let mockLegalFormRepo: jest.Mocked<LegalFormRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock instances
    mockRatingRepo = new LegalFormRatingRepository() as jest.Mocked<LegalFormRatingRepository>;
    mockDocumentRepo = new UserDocumentRepository() as jest.Mocked<UserDocumentRepository>;
    mockLegalFormRepo = new LegalFormRepository() as jest.Mocked<LegalFormRepository>;

    service = new LegalFormRatingService();
    
    (service as any).ratingRepository = mockRatingRepo;
    (service as any).documentRepository = mockDocumentRepo;
    (service as any).legalFormRepository = mockLegalFormRepo;
  });

  describe("rateLegalForm", () => {
    const mockDocumentId = "123";
    const mockRating = 4;
    const mockDescription = "Document is good";
    const mockLegalFormId = "legal-form-123";

    it("should throw an error if document is not found", async () => {
      mockDocumentRepo.findByDocumentId.mockResolvedValue(null);

      await expect(service.rateLegalForm(mockDocumentId, mockRating, mockDescription))
        .rejects.toThrow("Document not found");
      
      expect(mockDocumentRepo.findByDocumentId).toHaveBeenCalledWith(Number(mockDocumentId));
    });

    it("should throw an error if document is already rated", async () => {
      const mockDocument = {
        id: "doc-123",
        legal_form_id: mockLegalFormId,
        is_client_rated: true
      } as IUserDocument;
      
      mockDocumentRepo.findByDocumentId.mockResolvedValue(mockDocument);

      await expect(service.rateLegalForm(mockDocumentId, mockRating, mockDescription))
        .rejects.toThrow("Document has already been rated");
      
      expect(mockDocumentRepo.findByDocumentId).toHaveBeenCalledWith(Number(mockDocumentId));
    });

    it("should successfully rate a document", async () => {
      const mockDocument = {
        id: "doc-123",
        legal_form_id: mockLegalFormId,
        is_client_rated: false
      } as IUserDocument;
      
      const mockSavedRating = {
        id: "rating-123",
        document_id: mockDocumentId,
        legal_form_id: mockLegalFormId,
        rating: mockRating,
        description: mockDescription
      } as ILegalFormRating;
      
      mockDocumentRepo.findByDocumentId.mockResolvedValue(mockDocument);
      mockRatingRepo.create.mockResolvedValue(mockSavedRating);
      mockRatingRepo.findByLegalFormId.mockResolvedValue([mockSavedRating]);
      
      const result = await service.rateLegalForm(mockDocumentId, mockRating, mockDescription);

      expect(mockDocumentRepo.findByDocumentId).toHaveBeenCalledWith(Number(mockDocumentId));
      expect(mockRatingRepo.create).toHaveBeenCalledWith({
        document_id: mockDocumentId,
        legal_form_id: mockLegalFormId,
        rating: mockRating,
        description: mockDescription
      });
      expect(mockDocumentRepo.update).toHaveBeenCalledWith("doc-123", {
        is_client_rated: true,
        document_rating: mockRating
      });
      expect(mockRatingRepo.findByLegalFormId).toHaveBeenCalledWith(mockLegalFormId);
      expect(mockLegalFormRepo.update).toHaveBeenCalledWith(mockLegalFormId, {
        rating: "4.0"
      });
      
      expect(result).toEqual({
        id: "rating-123",
        document_id: mockDocumentId,
        rating: mockRating,
        description: mockDescription
      });
    });
  });

  describe("updateLegalFormRating", () => {
    const mockLegalFormId = "legal-form-123";

    it("should not update if no ratings exist", async () => {
      mockRatingRepo.findByLegalFormId.mockResolvedValue([]);

      await (service as any).updateLegalFormRating(mockLegalFormId);

      expect(mockRatingRepo.findByLegalFormId).toHaveBeenCalledWith(mockLegalFormId);
      expect(mockLegalFormRepo.update).not.toHaveBeenCalled();
    });

    it("should calculate average rating correctly", async () => {
      const mockRatings = [
        { rating: 3 },
        { rating: 4 },
        { rating: 5 }
      ] as ILegalFormRating[];
      
      mockRatingRepo.findByLegalFormId.mockResolvedValue(mockRatings);

      await (service as any).updateLegalFormRating(mockLegalFormId);

      expect(mockRatingRepo.findByLegalFormId).toHaveBeenCalledWith(mockLegalFormId);
      expect(mockLegalFormRepo.update).toHaveBeenCalledWith(mockLegalFormId, {
        rating: "4.0"  // (3 + 4 + 5) / 3 = 4.0
      });
    });
  });
});
