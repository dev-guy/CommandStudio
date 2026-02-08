defmodule Cs.Scheduler.CommandScheduleEnvironment do
  @moduledoc false

  use Ash.Resource,
    otp_app: :cs,
    domain: Cs.Scheduler,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshTypescript.Resource]

  postgres do
    table "command_schedule_environments"
    repo Cs.Repo

    identity_index_names unique_command_schedule_environment: "cmd_sched_env_uidx"

    references do
      reference :command_schedule, on_delete: :delete
      reference :environment, on_delete: :delete
    end
  end

  typescript do
    type_name "CommandScheduleEnvironment"
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true
      accept [:command_schedule_id, :environment_id]
    end
  end

  attributes do
    uuid_primary_key :id

    create_timestamp :created_at
  end

  relationships do
    belongs_to :command_schedule, Cs.Scheduler.CommandSchedule do
      allow_nil? false
      public? true
    end

    belongs_to :environment, Cs.Scheduler.Environment do
      allow_nil? false
      public? true
    end
  end

  identities do
    identity :unique_command_schedule_environment, [:command_schedule_id, :environment_id]
  end
end
