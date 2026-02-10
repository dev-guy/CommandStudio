defmodule Cs.Scheduler.Variable do
  @moduledoc false

  use Ash.Resource,
    otp_app: :cs,
    domain: Cs.Scheduler,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshTypescript.Resource]

  alias Cs.Scheduler.VariableEnvironment

  postgres do
    table "variables"
    repo Cs.Repo
  end

  typescript do
    type_name "Variable"
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true
      accept [:name, :description, :value, :secret_value]
    end

    update :update do
      primary? true
      accept [:name, :description, :value, :secret_value]
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :name, :ci_string do
      allow_nil? false
      constraints match: ~r/^[A-Za-z][A-Za-z0-9_]*$/
      public? true
    end

    attribute :description, :string do
      allow_nil? true
      public? true
    end

    attribute :value, :string do
      allow_nil? true
      public? true
    end

    attribute :secret_value, :string do
      allow_nil? true
      sensitive? true
      public? true
    end

    create_timestamp :created_at
    update_timestamp :updated_at
  end

  relationships do
    many_to_many :environments, Cs.Scheduler.Environment do
      through VariableEnvironment
      source_attribute_on_join_resource :variable_id
      destination_attribute_on_join_resource :environment_id
      public? true
    end

    has_many :variable_environments, VariableEnvironment do
      destination_attribute :variable_id
      public? true
    end
  end
end
