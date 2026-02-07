defmodule Cns.Scheduler.Cron do
  @moduledoc false

  use Ash.Resource,
    otp_app: :cns,
    domain: Cns.Scheduler,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshTypescript.Resource]

  postgres do
    table "crons"
    repo Cns.Repo
  end

  typescript do
    type_name "Cron"
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true
      accept [:name, :crontab_expression]
    end

    update :update do
      primary? true
      accept [:name, :crontab_expression]
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :name, :string do
      allow_nil? false
      public? true
    end

    attribute :crontab_expression, :string do
      allow_nil? false
      constraints match: ~r/^\S+\s+\S+\s+\S+\s+\S+\s+\S+$/
      public? true
    end

    create_timestamp :created_at
    update_timestamp :updated_at
  end

  relationships do
    has_many :command_schedule_crons, Cns.Scheduler.CommandScheduleCron do
      destination_attribute :cron_id
      public? true
    end

    has_many :command_jobs, Cns.Scheduler.CommandJob do
      destination_attribute :cron_id
      public? true
    end
  end

  identities do
    identity :unique_name, [:name]
  end
end
