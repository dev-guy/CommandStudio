defmodule Cns.Scheduler.Workers.DispatchDueCommands do
  @moduledoc false

  use Oban.Worker, queue: :default, max_attempts: 1

  require Logger

  alias Cns.Scheduler
  alias Cns.Scheduler.Jobs
  alias Oban.Cron.Expression

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    with {:ok, command_schedules} <-
           Scheduler.list_command_schedules(
             load: [
               command: [:enabled],
               command_schedule_environments: [environment: [:enabled]],
               command_schedule_crons: [cron: [:crontab_expression]]
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
    environments =
      command_schedule.command_schedule_environments
      |> Enum.map(& &1.environment)
      |> Enum.reject(&is_nil/1)

    crons =
      command_schedule.command_schedule_crons
      |> Enum.map(& &1.cron)
      |> Enum.reject(&is_nil/1)

    if command_schedule.command.enabled do
      if due_now?(crons, now, command_schedule.id) do
        environments
        |> Enum.filter(& &1.enabled)
        |> Enum.each(fn environment ->
          case Jobs.enqueue_command(
                 command_schedule.command_id,
                 environment_id: environment.id
               ) do
            {:ok, _job} ->
              :ok

            {:error, reason} ->
              Logger.error(
                "Unable to enqueue command #{command_schedule.command_id} for environment #{environment.id}: #{inspect(reason)}"
              )
          end
        end)
      end
    end
  end

  defp due_now?(crons, now, command_schedule_id) do
    Enum.any?(crons, fn cron ->
      case Expression.parse(cron.crontab_expression) do
        {:ok, expression} ->
          Expression.now?(expression, now)

        {:error, reason} ->
          Logger.warning(
            "Skipping cron #{cron.id} on command schedule #{command_schedule_id} because crontab expression is invalid: #{inspect(reason)}"
          )

          false
      end
    end)
  end
end
