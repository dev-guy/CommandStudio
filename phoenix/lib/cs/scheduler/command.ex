defmodule Cs.Scheduler.Command do
  @moduledoc false

  use Ash.Resource,
    otp_app: :cs,
    domain: Cs.Scheduler,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshTypescript.Resource]

  alias Cs.Scheduler.Jobs

  postgres do
    table "commands"
    repo Cs.Repo
  end

  typescript do
    type_name "Command"
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true
      accept [:name, :shell_command, :enabled, :timeout_ms]
    end

    update :update do
      primary? true
      accept [:name, :shell_command, :enabled, :timeout_ms]
    end

    read :enabled do
      filter expr(enabled == true)
    end

    action :enqueue_run, :uuid do
      argument :id, :uuid, allow_nil?: false
      argument :environment_id, :uuid, allow_nil?: true

      run fn input, _context ->
        case Jobs.enqueue_command(
               input.arguments.id,
               environment_id: Map.get(input.arguments, :environment_id)
             ) do
          {:ok, _job} -> {:ok, input.arguments.id}
          {:error, reason} -> {:error, reason}
        end
      end
    end

    action :enqueue_run_in, :uuid do
      argument :id, :uuid, allow_nil?: false
      argument :environment_id, :uuid, allow_nil?: true
      argument :delay_seconds, :integer, allow_nil?: false, constraints: [min: 1]

      run fn input, _context ->
        case Jobs.enqueue_command(
               input.arguments.id,
               environment_id: Map.get(input.arguments, :environment_id),
               delay_seconds: input.arguments.delay_seconds
             ) do
          {:ok, _job} -> {:ok, input.arguments.id}
          {:error, reason} -> {:error, reason}
        end
      end
    end

    action :enqueue_run_force, :uuid do
      argument :id, :uuid, allow_nil?: false
      argument :environment_id, :uuid, allow_nil?: true

      run fn input, _context ->
        case Jobs.enqueue_command(
               input.arguments.id,
               force?: true,
               environment_id: Map.get(input.arguments, :environment_id)
             ) do
          {:ok, _job} -> {:ok, input.arguments.id}
          {:error, reason} -> {:error, reason}
        end
      end
    end

    action :retry_last_failed, :uuid do
      argument :id, :uuid, allow_nil?: false

      run fn input, _context ->
        case Cs.Scheduler.list_command_job_events(
               query: [
                 filter: [command_job: [command_id: input.arguments.id], status: "failed"],
                 sort: [started_at: :desc],
                 limit: 1
               ]
             ) do
          {:ok, [_event | _rest]} ->
            case Jobs.enqueue_command(input.arguments.id, force?: true) do
              {:ok, _job} -> {:ok, input.arguments.id}
              {:error, reason} -> {:error, reason}
            end

          {:ok, []} ->
            {:error, "no failed command job event found for command"}

          {:error, reason} ->
            {:error, reason}
        end
      end
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :name, :string do
      allow_nil? false
      public? true
    end

    attribute :shell_command, :string do
      allow_nil? false
      sensitive? true
      public? true
    end

    attribute :enabled, :boolean do
      allow_nil? false
      default true
      public? true
    end

    attribute :timeout_ms, :integer do
      allow_nil? false
      default 60_000
      constraints min: 1
      public? true
    end

    create_timestamp :created_at
    update_timestamp :updated_at
  end

  relationships do
    has_many :command_jobs, Cs.Scheduler.CommandJob do
      destination_attribute :command_id
      public? true
    end

    has_many :command_schedules, Cs.Scheduler.CommandSchedule do
      destination_attribute :command_id
      public? true
    end
  end

  identities do
    identity :unique_name, [:name]
  end
end
