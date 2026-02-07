defmodule Cns.Scheduler.Jobs do
  @moduledoc false

  alias Cns.Scheduler
  alias Cns.Scheduler.Workers.RunCommand

  @type enqueue_opt ::
          {:force?, boolean()}
          | {:delay_seconds, non_neg_integer()}
          | {:max_attempts, pos_integer()}
          | {:priority, non_neg_integer()}

  @spec enqueue_command(Ecto.UUID.t(), keyword(enqueue_opt())) ::
          {:ok, Oban.Job.t()} | {:error, Ecto.Changeset.t()} | {:error, term()}
  def enqueue_command(command_id, opts \\ []) do
    with :ok <- validate_enabled(command_id, Keyword.get(opts, :force?, false)) do
      %{command_id: command_id}
      |> RunCommand.new(build_job_opts(opts))
      |> Oban.insert()
    end
  end

  defp validate_enabled(_command_id, true), do: :ok

  defp validate_enabled(command_id, false) do
    case Scheduler.get_command(command_id) do
      {:ok, %{enabled: true}} -> :ok
      {:ok, %{enabled: false}} -> {:error, "command is disabled"}
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
