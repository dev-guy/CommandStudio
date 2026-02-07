defmodule Cns.Scheduler.CommandExecutionEvent do
  @moduledoc false

  use Ash.Resource,
    otp_app: :cns,
    domain: Cns.Scheduler,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshTypescript.Resource]

  alias Cns.Scheduler.Jobs

  postgres do
    table "command_execution_events"
    repo Cns.Repo

    references do
      reference :command, on_delete: :delete
    end

    custom_indexes do
      index [:command_id, :started_at]
      index [:status, :started_at]
    end
  end

  typescript do
    type_name "CommandExecutionEvent"
  end

  actions do
    defaults [:read]

    create :create do
      primary? true
      accept [:command_id, :status, :started_at, :finished_at, :duration_ms, :stdout, :stderr]
      validate one_of(:status, ["started", "succeeded", "failed"])
    end

    read :for_command do
      argument :command_id, :uuid, allow_nil?: false
      filter expr(command_id == ^arg(:command_id))
    end

    action :retry, :uuid do
      argument :id, :uuid, allow_nil?: false

      run fn input, _context ->
        with {:ok, event} <- Cns.Scheduler.get_command_execution_event(input.arguments.id),
             {:ok, _job} <- Jobs.enqueue_command(event.command_id, force?: true) do
          {:ok, event.command_id}
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
      allow_nil? false
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

    create_timestamp :created_at
  end

  relationships do
    belongs_to :command, Cns.Scheduler.Command do
      allow_nil? false
      public? true
    end
  end
end
