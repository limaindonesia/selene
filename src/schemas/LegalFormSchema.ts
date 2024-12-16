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

@ObjectType() 
export class LegalFormCategory {
  @Field()
  category: string;

  @Field()
  total: number;
}

@InputType()
export class LegalFormInput {
  @Field()
  title: string;

  @Field()
  content: string;
}
