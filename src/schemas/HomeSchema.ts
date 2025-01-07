import { ObjectType, Field, ID } from "type-graphql";

@ObjectType()
export class Category {
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
  @Field(() => [Category])
  categories: Category[];

  @Field(() => [Template])
  templates: Template[];
}
