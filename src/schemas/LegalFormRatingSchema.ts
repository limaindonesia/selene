import { Field, InputType, ObjectType, Int } from "type-graphql";

@InputType()
export class RateLegalFormInput {
  @Field(() => Int)
  document_id: number;

  @Field()
  rating: number;

  @Field({ nullable: true })
  description?: string;
}

@ObjectType()
export class RatingData {
  @Field()
  id: string;

  @Field(() => Int)
  document_id: number;

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
