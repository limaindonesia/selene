import { ObjectType, Field, Int, Float, ID, InputType } from "type-graphql";
import { GraphQLJSON } from "graphql-scalars"; 

@InputType()
export class LegalForm {
  @Field()
  name: string;

  @Field()
  category: string;

  @Field()
  description: string;

  @Field()
  status: string;

  @Field()
  price: number;

  @Field()
  final_price: number;

  @Field(() => [String], { nullable: true })
  keywords?: string[];

  @Field()
  picture_url: string;

  @Field()
  template_doc_id: string;

  @Field({ nullable: true })
  is_highlight?: boolean;

  @Field(() => [GraphQLJSON], { nullable: true })
  form_detail?: any[];
}

@InputType()
export class LegalFormInput {
  @Field()
  name: string;

  @Field()
  category: string;
}

@ObjectType()
export class PaginatedLegalForms {
  @Field(() => Int)
  totalItems: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  currentPage: number;

  @Field(() => [LegalForm])
  data: LegalForm[];
}

@ObjectType()
export class LegalFormDetail {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  price: string;

  @Field()
  final_price: string;

  @Field()
  description: string;

  @Field()
  picture_url: string;

  @Field()
  category: string;

  @Field()
  rating: string;

  @Field()
  total_created: number;

  @Field()
  template: string;
}