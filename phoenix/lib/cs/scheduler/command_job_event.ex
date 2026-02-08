defmodule Cs.Scheduler.CommandJobEvent do
  @moduledoc false

  use Ash.Resource,
    otp_app: :cs,
    domain: Cs.Scheduler,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshTypescript.Resource]

  alias Cs.Scheduler.Jobs

  postgres do
    table "command_job_events"
    repo Cs.Repo

    references do
      reference :command_job, on_delete: :delete
    end

    custom_indexes do
      index [:command_job_id, :started_at]
      index [:status, :started_at]
    end
  end

  typescript do
    type_name "CommandJobEvent"
  end

  actions do
    defaults [:read]

    create :create do
      primary? true

      accept [
        :command_job_id,
        :status,
        :started_at,
        :finished_at,
        :duration_ms,
        :stdout,
        :stderr
      ]

      validate one_of(:status, ["started", "succeeded", "failed"])
    end

    read :for_command do
      argument :command_id, :uuid, allow_nil?: false
      filter expr(command_job.command_id == ^arg(:command_id))
    end

    action :retry, :uuid do
      argument :id, :uuid, allow_nil?: false

      run fn input, _context ->
        with {:ok, event} <-
               Cs.Scheduler.get_command_job_event(input.arguments.id, load: [command_job: []]),
             {:ok, _job} <-
               Jobs.enqueue_command(
                 event.command_job.command_id,
                 force?: true,
                 environment_id: event.command_job.environment_id,
                 cron_id: event.command_job.cron_id
               ) do
          {:ok, event.command_job.command_id}
        end
      end
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :status, :string do
      allow_nil? false
      public? true
    end

    attribute :started_at, :utc_datetime_usec do
      allow_nil? true
      public? true
    end

    attribute :finished_at, :utc_datetime_usec do
      public? true
    end

    attribute :duration_ms, :integer do
      constraints min: 0
      public? true
    end

    attribute :stdout, :string do
      default ""
      allow_nil? false
      constraints allow_empty?: true
      sensitive? true
      public? true
    end

    attribute :stderr, :string do
      default ""
      allow_nil? false
      constraints allow_empty?: true
      sensitive? true
      public? true
    end

    attribute :created_at, :utc_datetime_usec do
      allow_nil? false
      writable? false
      default &DateTime.utc_now/0
      public? true
    end
  end

  relationships do
    belongs_to :command_job, Cs.Scheduler.CommandJob do
      allow_nil? false
      public? true
    end
  end
end
