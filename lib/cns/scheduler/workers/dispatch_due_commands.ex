defmodule Cns.Scheduler.Workers.DispatchDueCommands do
  @moduledoc false

  use Oban.Worker, queue: :default, max_attempts: 1

  alias Cns.Scheduler
  alias Cns.Scheduler.Jobs
  alias Oban.Cron.Expression

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    with {:ok, command_schedules} <-
           Scheduler.list_command_schedules(
             load: [
               command: [:enabled],
               command_schedule_environments: [environment: [:enabled]],
               command_schedule_crons: [cron: [:crontab_expression, :enabled]]
             ]
           ),
         {:ok, now} <- DateTime.now("Etc/UTC") do
      now = DateTime.truncate(now, :second)

      Enum.each(command_schedules, fn command_schedule ->
        maybe_enqueue(command_schedule, now)
      end)

      :ok
    else
      {:error, reason} -> {:error, inspect(reason)}
    end
  end

  defp maybe_enqueue(command_schedule, now) do
    if command_schedule.enabled and command_schedule.command.enabled do
      environments =
        command_schedule.command_schedule_environments
        |> Enum.map(& &1.environment)
        |> Enum.reject(&is_nil/1)
        |> Enum.filter(& &1.enabled)

      crons =
        command_schedule.command_schedule_crons
        |> Enum.map(& &1.cron)
        |> Enum.reject(&is_nil/1)

      due_crons = due_now_crons(crons, now, command_schedule.id)

      enqueue_due(command_schedule.command_id, due_crons, environments)
    else
      :ok
    end
  end

  defp enqueue_due(_command_id, [], _environments), do: :ok
  defp enqueue_due(_command_id, _due_crons, []), do: :ok

  defp enqueue_due(command_id, due_crons, environments) do
    Enum.each(due_crons, fn cron ->
      Enum.each(environments, fn environment ->
        case Jobs.enqueue_command(
               command_id,
               environment_id: environment.id,
               cron_id: cron.id
             ) do
          {:ok, _job} ->
            :ok

          {:error, reason} ->
            Logger.error(
              "Unable to enqueue command #{command_id} for environment #{environment.id} (cron #{cron.id}): #{inspect(reason)}"
            )
        end
      end)
    end)
  end

  defp due_now_crons(crons, now, command_schedule_id) do
    Enum.filter(crons, fn cron ->
      if cron.enabled do
        case Expression.parse(cron.crontab_expression) do
          {:ok, expression} ->
            Expression.now?(expression, now)

          {:error, reason} ->
            Logger.warning(
              "Skipping cron #{cron.id} on command schedule #{command_schedule_id} because crontab expression is invalid: #{inspect(reason)}"
            )

            false
        end
      else
        false
      end
    end)
  end
end
