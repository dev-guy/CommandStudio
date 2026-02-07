defmodule Cns.Scheduler.Workers.RunCommand do
  @moduledoc false

  use Oban.Worker, queue: :default, max_attempts: 3

  alias Cns.Scheduler
  alias Cns.Scheduler.CommandRunner

  @impl Oban.Worker
  def perform(%Oban.Job{
        id: oban_job_id,
        args: %{"command_id" => command_id, "environment_id" => environment_id}
      }) do
    with {:ok, command_job} <- fetch_command_job(oban_job_id),
         {:ok, command} <- fetch_command(command_id),
         {:ok, environment} <- fetch_environment(environment_id),
         {rendered_command, env_pairs} <- build_command_input(command, environment),
         {:ok, started_at} <- DateTime.now("Etc/UTC"),
         :ok <- maybe_mark_started(oban_job_id, started_at, rendered_command),
         {:ok, _event} <- create_started_event(command_job.id, started_at),
         result <- CommandRunner.run(rendered_command, env_pairs, command.timeout_ms),
         {:ok, finished_at} <- DateTime.now("Etc/UTC"),
         :ok <- maybe_mark_finished(oban_job_id, finished_at),
         duration_ms <- DateTime.diff(finished_at, started_at, :millisecond),
         :ok <-
           create_completion_event(
             command_job.id,
             started_at,
             finished_at,
             duration_ms,
             result
           ) do
      case result do
        {:ok, _details} -> :ok
        {:error, message, _details} -> {:error, message}
      end
    else
      {:error, reason} -> {:error, inspect(reason)}
    end
  end

  def perform(%Oban.Job{args: %{"command_id" => _command_id}}) do
    {:error, "missing environment_id in job args"}
  end

  defp fetch_command(command_id) do
    Scheduler.get_command(command_id)
  end

  defp fetch_command_job(oban_job_id) do
    case Scheduler.get_command_job_by_oban_job_id(oban_job_id) do
      {:ok, nil} -> {:error, "command job not found for oban job id #{oban_job_id}"}
      other -> other
    end
  end

  defp fetch_environment(environment_id) do
    Scheduler.get_environment(environment_id, load: [variables: [:value]])
  end

  defp create_started_event(command_job_id, started_at) do
    Scheduler.create_command_job_event(%{
      command_job_id: command_job_id,
      status: "started",
      started_at: started_at,
      stdout: "",
      stderr: ""
    })
  end

  defp build_command_input(command, environment) do
    variables =
      environment.variables
      |> Enum.reduce(%{}, fn variable, acc ->
        Map.put(acc, variable.name, variable.value)
      end)

    env_pairs = Enum.map(variables, fn {name, value} -> {name, value} end)
    rendered_command = CommandRunner.interpolate_command(command.shell_command, variables)

    {rendered_command, env_pairs}
  end

  defp create_completion_event(
         command_job_id,
         started_at,
         finished_at,
         duration_ms,
         result
       ) do
    {status, stdout, stderr} =
      case result do
        {:ok, {stdout, stderr, _status_code}} ->
          {"succeeded", stdout, stderr}

        {:error, reason, {stdout, stderr, _status_code}} ->
          {"failed", stdout, append_error(stderr, reason)}
      end

    case Scheduler.create_command_job_event(%{
           command_job_id: command_job_id,
           status: status,
           started_at: started_at,
           finished_at: finished_at,
           duration_ms: duration_ms,
           stdout: stdout,
           stderr: stderr
         }) do
      {:ok, _event} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  defp maybe_mark_started(oban_job_id, started_at, rendered_command)
       when is_integer(oban_job_id) do
    maybe_update_command_job(oban_job_id, %{
      started_at: started_at,
      shell_command: rendered_command
    })
  end

  defp maybe_mark_started(_oban_job_id, _started_at, _rendered_command), do: :ok

  defp maybe_mark_finished(oban_job_id, finished_at) when is_integer(oban_job_id) do
    maybe_update_command_job(oban_job_id, %{finished_at: finished_at})
  end

  defp maybe_mark_finished(_oban_job_id, _finished_at), do: :ok

  defp maybe_update_command_job(oban_job_id, attrs) do
    case Scheduler.get_command_job_by_oban_job_id(oban_job_id) do
      {:ok, nil} ->
        :ok

      {:ok, command_job} ->
        case Scheduler.update_command_job(command_job.id, attrs) do
          {:ok, _updated} -> :ok
          {:error, _reason} -> :ok
        end

      {:error, _reason} ->
        :ok
    end
  end

  defp append_error(stderr, reason) when stderr == "", do: reason
  defp append_error(stderr, reason), do: stderr <> "\n" <> reason
end
