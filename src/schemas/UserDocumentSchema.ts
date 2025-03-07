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
  original_price: number;

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
export class PaginationLinks {
  @Field(() => String, { nullable: true })
  next?: string;
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
export class UserDocumentResponse {
  @Field(() => [UserDocument])
  data: UserDocument[];

  @Field(() => Pagination, { nullable: true })
  pagination?: Pagination;

  @Field()
  message: string;
}

@ObjectType()
export class LegalFormDocument {

  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  price: number;

  @Field()
  original_price: number;
  
}

@ObjectType()
export class UserDocument {

  @Field(() => ID)
  id: string;

  @Field()
  document_id: number;

  @Field()
  legal_form_id: string;

  @Field()
  client_id: number;

  @Field()
  status: number;

  @Field({ nullable: true })
  is_client_rated?: boolean;

  @Field({ nullable: true })
  document_rating?: number;

  @Field({ nullable: true })
  generated_at?: Date;

  @Field({ nullable: true })
  generated_html?: string;

  @Field(() => [String], { nullable: true })
  file?: string[];

  @Field(() => LegalFormDocument, { nullable: true })
  legal_form?: LegalFormDocument;

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
  client_id: number;

  @Field()
  status: number;

  @Field({ nullable: true })
  is_client_rated?: boolean;

  @Field({ nullable: true })
  document_rating?: number;

  @Field({ nullable: true })
  generated_at?: Date;

  @Field({ nullable: true })
  generated_html?: string;

  @Field(() => [String], { nullable: true })
  file?: string[];
}

@InputType()
export class CreateDocumentWithInput {
  @Field()
  client_id: number;

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
  generated_html?: string;

  @Field({ nullable: true })
  file?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  input: any;
}

@ObjectType()
export class DocumentGenerationData {
  @Field(() => Int, { nullable: true })
  document_id?: number;

  @Field({ nullable: true })
  id?: string;

  @Field({ nullable: true })
  job_id?: string;

  @Field()
  status: string;
}

@ObjectType()
export class DocumentGenerationResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => DocumentGenerationData, { nullable: true })
  data?: DocumentGenerationData;
}

@ObjectType()
export class DocumentJobData {
  @Field()
  job_id: string;

  @Field()
  status: string;

  @Field(() => Float, { nullable: true })
  progress?: number;

  @Field(() => GraphQLJSON, { nullable: true })
  result?: any;
}

@ObjectType()
export class DocumentJobResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => DocumentJobData, { nullable: true })
  data?: DocumentJobData;
}

@ObjectType()
export class DocumentFileUrlData {
  @Field(() => String)
  file_url: string;

  @Field(() => String)
  file_name: string;

  @Field(() => String)
  content_type: string;
}

@ObjectType()
export class DocumentFileUrlResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String, { nullable: true })
  message?: string;

  @Field(() => DocumentFileUrlData)
  data: DocumentFileUrlData;
}
