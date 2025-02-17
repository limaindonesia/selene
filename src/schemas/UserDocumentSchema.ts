import { ObjectType, Field, ID, InputType, Float, Int } from "type-graphql";
import { GraphQLJSON } from "graphql-scalars";

@ObjectType()
export class LegalFormDetails {
  @Field(() => ID)
  id: string;

  @Field()
  category_id: string;

  @Field()
  name: string;

  @Field(() => Float)
  price: number;

  @Field(() => Float)
  final_price: number;

  @Field()
  description: string;

  @Field()
  picture_url: string;

  @Field()
  category: string;

  @Field(() => Float)
  rating: number;

  @Field(() => Int)
  total_created: number;
}

@ObjectType()
export class Pagination {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  count: number;

  @Field(() => Int)
  per_page: number;

  @Field(() => Int)
  current_page: number;

  @Field(() => Int)
  total_pages: number;

  @Field(() => PaginationLinks)
  links: PaginationLinks;
}

@ObjectType()
export class PaginationLinks {
  @Field(() => String, { nullable: true })
  next?: string;
}

@ObjectType()
export class UserDocumentResponse {
  @Field(() => [UserDocument])
  data: UserDocument[];

  @Field(() => Pagination, { nullable: true })
  pagination?: Pagination;

  @Field()
  message: string;
}

@ObjectType()
export class UserDocument {
  @Field(() => LegalFormDetails, { nullable: true })
  legal_form?: LegalFormDetails;

  @Field(() => ID)
  id: string;

  @Field()
  document_id: number;

  @Field()
  legal_form_id: string;

  @Field()
  client_id: string;

  @Field()
  status: number;

  @Field({ nullable: true })
  is_client_rated?: boolean;

  @Field({ nullable: true })
  document_rating?: number;

  @Field({ nullable: true })
  generated_at?: Date;

  @Field(() => [String], { nullable: true })
  file?: string[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class UserDocumentInput {
  @Field()
  legal_form_id: string;

  @Field()
  client_id: string;

  @Field()
  status: number;

  @Field({ nullable: true })
  is_client_rated?: boolean;

  @Field({ nullable: true })
  document_rating?: number;

  @Field({ nullable: true })
  generated_at?: Date;

  @Field(() => [String], { nullable: true })
  file?: string[];
}

@InputType()
export class CreateDocumentWithInput {
  @Field()
  client_id: string;

  @Field()
  legal_form_id: string;

  @Field()
  status: number;

  @Field({ nullable: true })
  is_client_rated?: boolean;

  @Field({ nullable: true })
  document_rating?: string;

  @Field({ nullable: true })
  generated_at?: string;

  @Field({ nullable: true })
  file?: string;

  @Field(() => GraphQLJSON)
  input: any;
}
