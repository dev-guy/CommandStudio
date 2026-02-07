defmodule Cns.Scheduler.CommandSchedule do
  @moduledoc false

  use Ash.Resource,
    otp_app: :cns,
    domain: Cns.Scheduler,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshTypescript.Resource]

  postgres do
    table "command_schedules"
    repo Cns.Repo

    references do
      reference :command, on_delete: :delete
    end
  end

  typescript do
    type_name "CommandSchedule"
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true
      accept [:command_id, :enabled]
    end

    update :update do
      primary? true
      accept [:command_id, :enabled]
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :enabled, :boolean do
      allow_nil? false
      default true
      public? true
    end

    create_timestamp :created_at
    update_timestamp :updated_at
  end

  relationships do
    belongs_to :command, Cns.Scheduler.Command do
      allow_nil? false
      public? true
    end

    has_many :command_schedule_environments, Cns.Scheduler.CommandScheduleEnvironment do
      destination_attribute :command_schedule_id
      public? true
    end

    has_many :command_schedule_crons, Cns.Scheduler.CommandScheduleCron do
      destination_attribute :command_schedule_id
      public? true
    end
  end
end
