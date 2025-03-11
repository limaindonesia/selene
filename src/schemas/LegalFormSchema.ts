import { ObjectType, Field, Int, Float, ID, InputType } from "type-graphql";
import { GraphQLJSON } from "graphql-scalars"; 

@ObjectType()
export class LegalForm {

  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => [String], { nullable: true })
  slug: string;

  @Field()
  category: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  status: string;

  @Field()
  price: number;

  @Field()
  original_price: number;

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

  @Field({ nullable: true })
  rating: string;

  @Field({ nullable: true })
  total_created: number;

  @Field({ nullable: true })
  formatted_price?: string;

  @Field({ nullable: true })
  formatted_original_price?: string;
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
  total_items: number;

  @Field(() => Int)
  current_page: number;

  @Field(() => [LegalForm])
  data: LegalForm[];
}

@ObjectType()
export class LegalFormDetail {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
  
  @Field()
  slug: string;

  @Field()
  price: string;

  @Field()
  original_price: string;

  @Field()
  description: string;

  @Field()
  picture_url: string;

  @Field()
  category: string;

  @Field({ nullable: true })
  rating: string;

  @Field({ nullable: true })
  total_created: number;
  
  @Field()
  template: string;

  @Field(() => [GraphQLJSON], { nullable: true })
  form_detail?: any[];

  @Field({ nullable: true })
  formatted_price?: string;

  @Field({ nullable: true })
  formatted_original_price?: string;
}