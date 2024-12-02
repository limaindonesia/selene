import { ObjectType, Field, ID, InputType } from "type-graphql";

@ObjectType() 
export class LegalForm {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  content: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class LegalFormInput {
  @Field()
  title: string;

  @Field()
  content: string;
}
