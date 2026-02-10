defmodule Cs.Scheduler.VariableEnvironment do
  @moduledoc false

  use Ash.Resource,
    otp_app: :cs,
    domain: Cs.Scheduler,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshCloak, AshTypescript.Resource]

  postgres do
    table "variable_environments"
    repo Cs.Repo

    references do
      reference :variable, on_delete: :delete
      reference :environment, on_delete: :delete
    end
  end

  cloak do
    vault(Cs.Vault)
    attributes([:secret_value])
  end

  typescript do
    type_name "VariableEnvironment"
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true
      accept [:variable_id, :environment_id, :regular_value, :secret_value]
    end

    update :update do
      primary? true
      accept [:regular_value, :secret_value]
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :regular_value, :string do
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
    belongs_to :variable, Cs.Scheduler.Variable do
      source_attribute :variable_id
      allow_nil? false
      public? true
    end

    belongs_to :environment, Cs.Scheduler.Environment do
      source_attribute :environment_id
      allow_nil? false
      public? true
    end
  end

  identities do
    identity :unique_link, [:environment_id, :variable_id]
  end
end
