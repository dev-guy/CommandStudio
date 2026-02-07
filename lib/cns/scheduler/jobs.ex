defmodule Cns.Scheduler.Jobs do
  @moduledoc false

  alias Cns.Scheduler
  alias Cns.Scheduler.Workers.RunCommand

  @type enqueue_opt ::
          {:force?, boolean()}
          | {:environment_id, Ecto.UUID.t()}
          | {:delay_seconds, non_neg_integer()}
          | {:max_attempts, pos_integer()}
          | {:priority, non_neg_integer()}

  @spec enqueue_command(Ecto.UUID.t(), keyword(enqueue_opt())) ::
          {:ok, Oban.Job.t()} | {:error, Ecto.Changeset.t()} | {:error, term()}
  def enqueue_command(command_id, opts \\ []) do
    with {:ok, environment_id} <- resolve_environment_id(command_id, opts),
         :ok <-
           validate_enabled(command_id, environment_id, Keyword.get(opts, :force?, false)) do
      %{command_id: command_id, environment_id: environment_id}
      |> RunCommand.new(build_job_opts(opts))
      |> Oban.insert()
    end
  end

  defp resolve_environment_id(command_id, opts) do
    case Keyword.get(opts, :environment_id) do
      environment_id when is_binary(environment_id) ->
        {:ok, environment_id}

      _ ->
        resolve_environment_from_schedules(
          command_id: command_id,
          force?: Keyword.get(opts, :force?, false)
        )
    end
  end

  defp resolve_environment_from_schedules(command_id: command_id, force?: force?) do
    with {:ok, schedules} <-
           Scheduler.list_command_schedules(
             query: [filter: [command_id: command_id]],
             load: [command_schedule_environments: [environment: [:id, :enabled]]]
           ) do
      environments =
        schedules
        |> Enum.flat_map(fn schedule ->
          schedule.command_schedule_environments
          |> Enum.map(& &1.environment)
          |> Enum.reject(&is_nil/1)
        end)
        |> Enum.uniq_by(& &1.id)

      environment =
        if force? do
          List.first(environments)
        else
          Enum.find(environments, & &1.enabled)
        end

      case environment do
        nil when environments == [] ->
          {:error, "command has no scheduled environments"}

        nil ->
          {:error, "no enabled environment is scheduled for command"}

        environment ->
          {:ok, environment.id}
      end
    end
  end

  defp validate_enabled(_command_id, _environment_id, true), do: :ok

  defp validate_enabled(command_id, environment_id, false) do
    with {:ok, command} <- Scheduler.get_command(command_id),
         {:ok, environment} <- Scheduler.get_environment(environment_id) do
      cond do
        not command.enabled ->
          {:error, "command is disabled"}

        not environment.enabled ->
          {:error, "environment is disabled"}

        true ->
          :ok
      end
    else
      {:error, reason} -> {:error, reason}
    end
  end

  defp build_job_opts(opts) do
    []
    |> maybe_put_delay(opts)
    |> maybe_put_opt(:max_attempts, opts)
    |> maybe_put_opt(:priority, opts)
  end

  defp maybe_put_delay(job_opts, opts) do
    case Keyword.get(opts, :delay_seconds) do
      nil ->
        job_opts

      delay_seconds ->
        Keyword.put(job_opts, :schedule_in, delay_seconds)
    end
  end

  defp maybe_put_opt(job_opts, key, opts) do
    case Keyword.get(opts, key) do
      nil -> job_opts
      value -> Keyword.put(job_opts, key, value)
    end
  end
end
