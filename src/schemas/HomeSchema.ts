import { ObjectType, Field, ID } from "type-graphql";

@ObjectType()
export class Categories {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  total_templates: number;
}

@ObjectType()
export class Template {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;
}

@ObjectType()
export class HomeResponse {
  @Field(() => [Categories])
  categories: Categories[];

  @Field(() => [Template])
  templates: Template[];
}
