import { ObjectType, Field, ID, InputType } from "type-graphql";
import { GraphQLJSON } from "graphql-scalars";

@ObjectType()
export class UserDocument {
  @Field(() => ID)
  id: string;

  @Field()
  document_id: number;

  @Field()
  legal_form_id: string;

  @Field()
  client_id: string;

  @Field()
  status: string;

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
  status: string;

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
  status: string;

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
