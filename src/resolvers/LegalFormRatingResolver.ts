import { Resolver, Mutation, Arg } from "type-graphql";
import { RateLegalFormInput, RatingResponse } from "../schemas/LegalFormRatingSchema";
import { LegalFormRatingService } from "../services/LegalFormRatingService";

@Resolver()
export class LegalFormRatingResolver {
  private service: LegalFormRatingService;

  constructor() {
    this.service = new LegalFormRatingService();
  }

  @Mutation(() => RatingResponse)
  async rateLegalForm(
    @Arg("input") input: RateLegalFormInput
  ): Promise<RatingResponse> {
    try {
      const result = await this.service.rateLegalForm(
        input.id,
        input.rating,
        input.description
      );
      
      return {
        success: true,
        message: "Document rating saved successfully.",
        data: result
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }
}
