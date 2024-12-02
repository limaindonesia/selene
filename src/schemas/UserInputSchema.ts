import { ObjectType, Field, ID, InputType } from "type-graphql";

@ObjectType() 
export class UserInput {
  @Field(() => ID)
  id: string;

  @Field()
  documentId: string;

  @Field()
  templateId: string;

  @Field()
  clientId: number;

  @Field()
  InputData: Object;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class UserInputInput {
  @Field()
  documentId: string;

  @Field()
  templateId: string;

  @Field()
  clientId: number;

  @Field()
  InputData: Object;
}
