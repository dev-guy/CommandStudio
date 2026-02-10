defmodule Cs.Scheduler.Workers.RunCommand do
  @moduledoc false

  use Oban.Worker, queue: :default, max_attempts: 3

  alias Cs.Scheduler
  alias Cs.Scheduler.CommandRunner

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"command_job_id" => command_job_id}}) do
    with {:ok, command_job} <- fetch_command_job(command_job_id),
         {:ok, command} <- fetch_command(command_job.command_id),
         {:ok, environment} <- fetch_environment(command_job.environment_id),
         {execution_command, display_command, env_pairs} <-
           build_command_input(command_job, command, environment),
         {:ok, started_at} <- DateTime.now("Etc/UTC"),
         :ok <- maybe_mark_started(command_job.id, started_at, display_command),
         {:ok, _event} <- create_started_event(command_job.id, started_at),
         result = CommandRunner.run(execution_command, env_pairs, command.timeout_ms),
         {:ok, finished_at} <- DateTime.now("Etc/UTC"),
         :ok <- maybe_mark_finished(command_job.id, finished_at),
         duration_ms = DateTime.diff(finished_at, started_at, :millisecond),
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

  def perform(%Oban.Job{}) do
    {:error, "missing command_job_id in job args"}
  end

  defp fetch_command(command_id) do
    Scheduler.get_command(command_id)
  end

  defp fetch_command_job(command_job_id) do
    case Scheduler.get_command_job(command_job_id) do
      {:ok, nil} -> {:error, "command job not found for id #{command_job_id}"}
      other -> other
    end
  end

  defp fetch_environment(environment_id) do
    Scheduler.get_environment(environment_id,
      load: [variable_environments: [:regular_value, :secret_value, variable: [:name]]]
    )
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

  defp build_command_input(command_job, command, environment) do
    execution_variables =
      Enum.reduce(environment.variable_environments, %{}, fn variable_environment, acc ->
        value = execution_value(variable_environment)

        if is_nil(value) do
          acc
        else
          Map.put(acc, to_string(variable_environment.variable.name), value)
        end
      end)

    display_variables =
      Enum.reduce(environment.variable_environments, %{}, fn variable_environment, acc ->
        value = display_value(variable_environment)

        if is_nil(value) do
          acc
        else
          Map.put(acc, to_string(variable_environment.variable.name), value)
        end
      end)

    env_pairs = Enum.map(execution_variables, fn {name, value} -> {name, value} end)

    command_template =
      if command_job.shell_command == "" do
        command.shell_command
      else
        command_job.shell_command
      end

    execution_command = CommandRunner.interpolate_command(command_template, execution_variables)
    display_command = CommandRunner.interpolate_command(command_template, display_variables)

    {execution_command, display_command, env_pairs}
  end

  defp execution_value(variable_environment) do
    if present?(variable_environment.secret_value) do
      variable_environment.secret_value
    else
      variable_environment.regular_value
    end
  end

  defp display_value(variable_environment) do
    if present?(variable_environment.secret_value) do
      nil
    else
      variable_environment.regular_value
    end
  end

  defp present?(value) when is_binary(value), do: value != ""
  defp present?(_value), do: false

  defp create_completion_event(command_job_id, started_at, finished_at, duration_ms, result) do
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

  defp maybe_mark_started(command_job_id, started_at, rendered_command) when is_binary(command_job_id) do
    maybe_update_command_job(command_job_id, %{
      started_at: started_at,
      shell_command: rendered_command
    })
  end

  defp maybe_mark_started(_command_job_id, _started_at, _rendered_command), do: :ok

  defp maybe_mark_finished(command_job_id, finished_at) when is_binary(command_job_id) do
    maybe_update_command_job(command_job_id, %{finished_at: finished_at})
  end

  defp maybe_mark_finished(_command_job_id, _finished_at), do: :ok

  defp maybe_update_command_job(command_job_id, attrs) do
    case Scheduler.get_command_job(command_job_id) do
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
