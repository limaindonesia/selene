import { ObjectType, Field, ID, InputType } from "type-graphql";
import { GraphQLJSON } from "graphql-scalars";

@ObjectType()
export class UserInput {
  @Field(() => ID)
  id: string;

  @Field()
  document_id: number;

  @Field(() => GraphQLJSON)
  input: any;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class UserInputInput {
  @Field()
  document_id: number;

  @Field(() => GraphQLJSON)
  input: any;
}
