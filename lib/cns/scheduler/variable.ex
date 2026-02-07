defmodule Cns.Scheduler.Variable do
  @moduledoc false

  use Ash.Resource,
    otp_app: :cns,
    domain: Cns.Scheduler,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshCloak, AshTypescript.Resource]

  postgres do
    table "variables"
    repo Cns.Repo

    references do
      reference :environment, on_delete: :delete
    end
  end

  cloak do
    vault(Cns.Vault)
    attributes [:value]
  end

  typescript do
    type_name "Variable"
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true
      accept [:name, :value, :environment_id]
    end

    update :update do
      primary? true
      accept [:name, :value]
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :name, :string do
      allow_nil? false
      constraints match: ~r/^[A-Z][A-Z0-9_]*$/
      public? true
    end

    attribute :value, :string do
      allow_nil? false
      sensitive? true
      public? true
    end

    create_timestamp :created_at
    update_timestamp :updated_at
  end

  relationships do
    belongs_to :environment, Cns.Scheduler.Environment do
      allow_nil? false
      public? true
    end
  end

  identities do
    identity :unique_name_per_environment, [:environment_id, :name]
  end
end
