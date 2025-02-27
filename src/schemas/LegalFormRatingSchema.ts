import { Field, InputType, ObjectType } from "type-graphql";

@InputType()
export class RateLegalFormInput {
  @Field()
  document_id: string;

  @Field()
  rating: number;

  @Field({ nullable: true })
  description?: string;
}

@ObjectType()
export class RatingData {
  @Field()
  id: string;

  @Field()
  document_id: string;

  @Field()
  rating: number;

  @Field({ nullable: true })
  description?: string;
}

@ObjectType()
export class RatingResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => RatingData, { nullable: true })
  data?: RatingData;
}
