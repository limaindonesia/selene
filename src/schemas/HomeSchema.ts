import { ObjectType, Field, ID } from "type-graphql";

@ObjectType()
export class Categories {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  icon_url: string;

  @Field()
  description: string;

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

  @Field()
  picture_url: string;
}

@ObjectType()
export class HomeResponse {
  @Field(() => [Categories])
  categories: Categories[];

  @Field(() => [Template])
  templates: Template[];
}
