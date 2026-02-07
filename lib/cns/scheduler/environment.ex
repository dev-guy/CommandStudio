defmodule Cns.Scheduler.Environment do
  @moduledoc false

  use Ash.Resource,
    otp_app: :cns,
    domain: Cns.Scheduler,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshTypescript.Resource]

  postgres do
    table "environments"
    repo Cns.Repo
  end

  typescript do
    type_name "Environment"
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true
      accept [:name]
    end

    update :update do
      primary? true
      accept [:name]
    end

    read :by_name do
      argument :name, :string, allow_nil?: false
      get? true
      filter expr(name == ^arg(:name))
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :name, :string do
      allow_nil? false
      public? true
    end

    create_timestamp :created_at
    update_timestamp :updated_at
  end

  relationships do
    has_many :variables, Cns.Scheduler.Variable do
      destination_attribute :environment_id
      public? true
    end

    has_many :commands, Cns.Scheduler.Command do
      destination_attribute :environment_id
      public? true
    end
  end

  identities do
    identity :unique_name, [:name]
  end
end
