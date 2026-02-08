defmodule Cs.Scheduler.CommandSchedule do
  @moduledoc false

  use Ash.Resource,
    otp_app: :cs,
    domain: Cs.Scheduler,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshTypescript.Resource]

  postgres do
    table "command_schedules"
    repo Cs.Repo

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
    belongs_to :command, Cs.Scheduler.Command do
      allow_nil? false
      public? true
    end

    many_to_many :environments, Cs.Scheduler.Environment do
      through Cs.Scheduler.CommandScheduleEnvironment
      source_attribute_on_join_resource :command_schedule_id
      destination_attribute_on_join_resource :environment_id
      public? true
    end

    many_to_many :crons, Cs.Scheduler.Cron do
      through Cs.Scheduler.CommandScheduleCron
      source_attribute_on_join_resource :command_schedule_id
      destination_attribute_on_join_resource :cron_id
      public? true
    end

    has_many :command_schedule_environments, Cs.Scheduler.CommandScheduleEnvironment do
      destination_attribute :command_schedule_id
      public? true
    end

    has_many :command_schedule_crons, Cs.Scheduler.CommandScheduleCron do
      destination_attribute :command_schedule_id
      public? true
    end
  end
end
