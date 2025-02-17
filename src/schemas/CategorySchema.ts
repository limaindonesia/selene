import { ObjectType, Field, ID, InputType } from "type-graphql";

@ObjectType()
export class Category {
  @Field(() => ID)
  id: string;

  @Field()
  string_id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  icon_url?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class CategoryInput {
  @Field()
  string_id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  icon_url?: string;
}
