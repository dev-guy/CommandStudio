defmodule Cns.Scheduler.Workers.DispatchDueCommands do
  @moduledoc false

  use Oban.Worker, queue: :default, max_attempts: 1

  require Logger

  alias Cns.Scheduler
  alias Cns.Scheduler.Jobs
  alias Oban.Cron.Expression

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    with {:ok, commands} <- Scheduler.list_enabled_commands(),
         {:ok, now} <- DateTime.now("Etc/UTC") do
      now = DateTime.truncate(now, :second)

      Enum.each(commands, fn command ->
        maybe_enqueue(command, now)
      end)

      :ok
    else
      {:error, reason} -> {:error, inspect(reason)}
    end
  end

  defp maybe_enqueue(command, now) do
    case Expression.parse(command.cron_expression) do
      {:ok, expression} ->
        if Expression.now?(expression, now) do
          case Jobs.enqueue_command(command.id) do
            {:ok, _job} ->
              :ok

            {:error, reason} ->
              Logger.error("Unable to enqueue command #{command.id}: #{inspect(reason)}")
          end
        end

      {:error, reason} ->
        Logger.warning(
          "Skipping command #{command.id} because cron_expression is invalid: #{inspect(reason)}"
        )
    end
  end
end
