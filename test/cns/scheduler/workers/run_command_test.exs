defmodule Cns.Scheduler.Workers.RunCommandTest do
  use Cns.DataCase, async: true

  alias Cns.Scheduler
  alias Cns.Scheduler.Workers.RunCommand

  test "perform records started and succeeded events" do
    environment =
      Scheduler.create_environment!(%{name: "test-env-#{System.unique_integer([:positive])}"})

    _variable =
      Scheduler.create_variable!(%{
        environment_id: environment.id,
        name: "NAME",
        value: "world"
      })

    command =
      Scheduler.create_command!(%{
        name: "test-command-#{System.unique_integer([:positive])}",
        shell_command: "printf 'hello-$NAME'",
        timeout_ms: 5_000
      })

    cron =
      Scheduler.create_cron!(%{
        name: "test-cron-#{System.unique_integer([:positive])}",
        crontab_expression: "* * * * *"
      })

    command_schedule = Scheduler.create_command_schedule!(%{command_id: command.id})
    Scheduler.create_command_schedule_environment!(%{command_schedule_id: command_schedule.id, environment_id: environment.id})
    Scheduler.create_command_schedule_cron!(%{command_schedule_id: command_schedule.id, cron_id: cron.id})

    assert :ok =
             RunCommand.perform(
               %Oban.Job{args: %{"command_id" => command.id, "environment_id" => environment.id}}
             )

    events =
      Scheduler.list_command_execution_events!(
        query: [filter: [command_id: command.id], sort: [started_at: :asc]]
      )

    assert Enum.count(events) == 2
    assert Enum.at(events, 0).status == "started"
    assert Enum.at(events, 1).status == "succeeded"
    assert Enum.at(events, 1).stdout == "hello-world"
  end

  test "perform records failed event on command errors" do
    environment =
      Scheduler.create_environment!(%{name: "test-env-#{System.unique_integer([:positive])}"})

    command =
      Scheduler.create_command!(%{
        name: "test-command-#{System.unique_integer([:positive])}",
        shell_command: "printf 'boom' 1>&2; exit 42",
        timeout_ms: 5_000
      })

    cron =
      Scheduler.create_cron!(%{
        name: "test-cron-#{System.unique_integer([:positive])}",
        crontab_expression: "* * * * *"
      })

    command_schedule = Scheduler.create_command_schedule!(%{command_id: command.id})
    Scheduler.create_command_schedule_environment!(%{command_schedule_id: command_schedule.id, environment_id: environment.id})
    Scheduler.create_command_schedule_cron!(%{command_schedule_id: command_schedule.id, cron_id: cron.id})

    assert {:error, _message} =
             RunCommand.perform(
               %Oban.Job{args: %{"command_id" => command.id, "environment_id" => environment.id}}
             )

    events =
      Scheduler.list_command_execution_events!(
        query: [filter: [command_id: command.id], sort: [started_at: :asc]]
      )

    assert Enum.count(events) == 2
    assert Enum.at(events, 0).status == "started"
    assert Enum.at(events, 1).status == "failed"
    assert Enum.at(events, 1).stderr =~ "boom"
  end
end
