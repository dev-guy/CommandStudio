- Do not generate database migrations manually
- Run `mix ash.codegen --dev` after changing resources to update the migrations
- Run `mix ash.migration` to apply the migrations to the database

## Many to Many Relationships

Here’s a clean, idiomatic Ash (Elixir) example with two resources and a many-to-many relationship using a join resource.

Scenario
	•	Blog.Post ↔ Blog.Tag
	•	A post can have many tags
	•	A tag can belong to many posts
	•	Join resource: Blog.PostTag

1) Post resource

defmodule MyApp.Blog.Post do
  use Ash.Resource,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "posts"
    repo MyApp.Repo
  end

  attributes do
    uuid_primary_key :id
    attribute :title, :string, allow_nil?: false
    create_timestamp :inserted_at
    update_timestamp :updated_at
  end

  relationships do
    many_to_many :tags, MyApp.Blog.Tag do
      through MyApp.Blog.PostTag
      source_attribute_on_join_resource :post_id
      destination_attribute_on_join_resource :tag_id
    end
  end

  actions do
    defaults [:create, :read, :update, :destroy]
  end
end

2) Tag resource

defmodule MyApp.Blog.Tag do
  use Ash.Resource,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "tags"
    repo MyApp.Repo
  end

  attributes do
    uuid_primary_key :id
    attribute :name, :string, allow_nil?: false
    create_timestamp :inserted_at
    update_timestamp :updated_at
  end

  relationships do
    many_to_many :posts, MyApp.Blog.Post do
      through MyApp.Blog.PostTag
      source_attribute_on_join_resource :tag_id
      destination_attribute_on_join_resource :post_id
    end
  end

  actions do
    defaults [:create, :read, :update, :destroy]
  end
end

3) Join resource (the bridge table)

defmodule MyApp.Blog.PostTag do
  use Ash.Resource,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "post_tags"
    repo MyApp.Repo
  end

  attributes do
    uuid_primary_key :id

    attribute :post_id, :uuid, allow_nil?: false
    attribute :tag_id, :uuid, allow_nil?: false

    create_timestamp :inserted_at
    update_timestamp :updated_at
  end

  relationships do
    belongs_to :post, MyApp.Blog.Post do
      source_attribute :post_id
      allow_nil? false
    end

    belongs_to :tag, MyApp.Blog.Tag do
      source_attribute :tag_id
      allow_nil? false
    end
  end

  actions do
    defaults [:create, :read, :destroy]
  end

  # Optional but highly recommended: ensure uniqueness at the DB layer too.
  # You'll typically add a unique index on [:post_id, :tag_id] in a migration.
end
