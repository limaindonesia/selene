import { ObjectType, Field, ID, InputType } from "type-graphql";

@ObjectType() 
export class LegalForm {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  category: string;

  @Field()
  description: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class LegalFormInput {
  @Field()
  name: string;

  @Field()
  category: string;
}
