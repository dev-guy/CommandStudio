defmodule Cns.Scheduler.CommandJob do
  @moduledoc false

  use Ash.Resource,
    otp_app: :cns,
    domain: Cns.Scheduler,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshTypescript.Resource]

  postgres do
    table "command_jobs"
    repo Cns.Repo

    references do
      reference :command, on_delete: :delete
      reference :environment, on_delete: :delete
      reference :cron, on_delete: :nilify
    end
  end

  typescript do
    type_name "CommandJob"
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true

      accept [
        :command_id,
        :environment_id,
        :cron_id,
        :oban_job_id,
        :shell_command,
        :cron_expression,
        :started_at,
        :finished_at
      ]
    end

    update :update do
      primary? true
      accept [:oban_job_id, :shell_command, :cron_expression, :started_at, :finished_at]
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :oban_job_id, :integer do
      allow_nil? true
      constraints min: 1
      public? true
    end

    attribute :shell_command, :string do
      allow_nil? false
      default ""
      constraints allow_empty?: true
      sensitive? true
      public? true
    end

    attribute :cron_expression, :string do
      allow_nil? false
      default ""
      constraints allow_empty?: true
      public? true
    end

    attribute :started_at, :utc_datetime_usec do
      public? true
    end

    attribute :finished_at, :utc_datetime_usec do
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

    belongs_to :environment, Cns.Scheduler.Environment do
      allow_nil? false
      public? true
    end

    belongs_to :cron, Cns.Scheduler.Cron do
      public? true
    end

    has_many :command_job_events, Cns.Scheduler.CommandJobEvent do
      destination_attribute :command_job_id
      public? true
    end
  end

  identities do
    identity :unique_oban_job_id, [:oban_job_id]
  end
end
