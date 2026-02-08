defmodule Cs.Scheduler.CommandScheduleCron do
  @moduledoc false

  use Ash.Resource,
    otp_app: :cs,
    domain: Cs.Scheduler,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshTypescript.Resource]

  postgres do
    table "command_schedule_crons"
    repo Cs.Repo

    identity_index_names unique_command_schedule_cron: "cmd_sched_cron_uidx"

    references do
      reference :command_schedule, on_delete: :delete
      reference :cron, on_delete: :delete
    end
  end

  typescript do
    type_name "CommandScheduleCron"
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true
      accept [:command_schedule_id, :cron_id]
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

    belongs_to :cron, Cs.Scheduler.Cron do
      allow_nil? false
      public? true
    end
  end

  identities do
    identity :unique_command_schedule_cron, [:command_schedule_id, :cron_id]
  end
end
