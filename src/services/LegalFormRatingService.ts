import { LegalFormRatingRepository } from "../repositories/LegalFormRatingRepository";
import { UserDocumentRepository } from "../repositories/UserDocumentRepository";
import { LegalFormRepository } from "../repositories/LegalFormRepository";
import { ILegalFormRating } from "../models/LegalFormRating";

export class LegalFormRatingService {
  private ratingRepository: LegalFormRatingRepository;
  private documentRepository: UserDocumentRepository;
  private legalFormRepository: LegalFormRepository;

  constructor() {
    this.ratingRepository = new LegalFormRatingRepository();
    this.documentRepository = new UserDocumentRepository();
    this.legalFormRepository = new LegalFormRepository();
  }

  async rateLegalForm(
    id: string,
    rating: number,
    description?: string
  ): Promise<any> {
    const document = await this.documentRepository.findById(id);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.is_client_rated) {
      throw new Error("Document has already been rated");
    }

    const ratingData: Partial<ILegalFormRating> = {
      document_id: document.document_id,
      legal_form_id: document.legal_form_id,
      rating: rating,
      description: description
    };

    const savedRating = await this.ratingRepository.create(ratingData);

    await this.documentRepository.update(document.id, {
      is_client_rated: true,
      document_rating: rating
    });

    await this.updateLegalFormRating(document.legal_form_id);

    return {
      id: savedRating.id,
      document_id: savedRating.document_id,
      rating: savedRating.rating,
      description: savedRating.description
    };
  }

  private async updateLegalFormRating(legal_form_id: string): Promise<void> {
    const allRatings = await this.ratingRepository.findRatingByLegalFormId(legal_form_id);
    
    if (allRatings.length === 0) {
      return;
    }

    const totalRating = allRatings.reduce((sum, item) => sum + item.rating, 0);
    const averageRating = (totalRating / allRatings.length).toFixed(1);

    await this.legalFormRepository.update(legal_form_id, {
      rating: averageRating
    });
  }
}
