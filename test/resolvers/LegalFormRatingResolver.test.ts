import { LegalFormRatingResolver } from "../../src/resolvers/LegalFormRatingResolver";
import { LegalFormRatingService } from "../../src/services/LegalFormRatingService";

jest.mock("../../src/services/LegalFormRatingService");

describe("LegalFormRatingResolver", () => {
  let resolver: LegalFormRatingResolver;
  let mockService: jest.Mocked<LegalFormRatingService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = new LegalFormRatingService() as jest.Mocked<LegalFormRatingService>;

    resolver = new LegalFormRatingResolver();
    
    (resolver as any).service = mockService;
  });

  describe("rateLegalForm", () => {
    const mockInput = {
      document_id: 123,
      rating: 4,
      description: "Document is good"
    };

    const mockResult = {
      id: "rating-123",
      document_id: "123",
      rating: 4,
      description: "Document is good"
    };

    it("should return success response when rating is successful", async () => {
      mockService.rateLegalForm.mockResolvedValue(mockResult);

      const response = await resolver.rateLegalForm(mockInput);

      expect(mockService.rateLegalForm).toHaveBeenCalledWith(
        mockInput.document_id,
        mockInput.rating,
        mockInput.description
      );
      
      expect(response).toEqual({
        success: true,
        message: "Document rating saved successfully.",
        data: {
          ...mockResult,
          document_id: 123
        }
      });
    });

    it("should return error response when service throws an error", async () => {
      const errorMessage = "Document not found";
      mockService.rateLegalForm.mockRejectedValue(new Error(errorMessage));

      const response = await resolver.rateLegalForm(mockInput);

      expect(mockService.rateLegalForm).toHaveBeenCalledWith(
        mockInput.document_id,
        mockInput.rating,
        mockInput.description
      );
      
      expect(response).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    it("should handle unknown errors gracefully", async () => {
      mockService.rateLegalForm.mockRejectedValue("Unknown error");

      const response = await resolver.rateLegalForm(mockInput);

      expect(response).toEqual({
        success: false,
        message: "An unknown error occurred",
      });
    });
  });
});
