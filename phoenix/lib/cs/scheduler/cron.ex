defmodule Cs.Scheduler.Cron do
  @moduledoc false

  use Ash.Resource,
    otp_app: :cs,
    domain: Cs.Scheduler,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshTypescript.Resource]

  alias Cs.Scheduler.CommandScheduleCron

  postgres do
    table "crons"
    repo Cs.Repo
  end

  typescript do
    type_name "Cron"
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true
      accept [:name, :crontab_expression, :enabled]
    end

    update :update do
      primary? true
      accept [:name, :crontab_expression, :enabled]
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

    attribute :enabled, :boolean do
      allow_nil? false
      default true
      public? true
    end

    create_timestamp :created_at
    update_timestamp :updated_at
  end

  relationships do
    many_to_many :command_schedules, Cs.Scheduler.CommandSchedule do
      through CommandScheduleCron
      source_attribute_on_join_resource :cron_id
      destination_attribute_on_join_resource :command_schedule_id
      public? true
    end

    has_many :command_schedule_crons, CommandScheduleCron do
      destination_attribute :cron_id
      public? true
    end

    has_many :command_jobs, Cs.Scheduler.CommandJob do
      destination_attribute :cron_id
      public? true
    end
  end

  identities do
    identity :unique_name, [:name]
  end
end
