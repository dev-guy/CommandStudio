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

    Scheduler.create_command_schedule_environment!(%{
      command_schedule_id: command_schedule.id,
      environment_id: environment.id
    })

    Scheduler.create_command_schedule_cron!(%{
      command_schedule_id: command_schedule.id,
      cron_id: cron.id
    })

    command_job =
      Scheduler.create_command_job!(%{
        command_id: command.id,
        environment_id: environment.id,
        cron_id: cron.id,
        oban_job_id: 101
      })

    assert :ok =
             RunCommand.perform(%Oban.Job{
               id: 101,
               args: %{"command_job_id" => command_job.id}
             })

    events =
      Scheduler.list_command_job_events!(query: [filter: [command_job_id: command_job.id], sort: [started_at: :asc]])

    assert Enum.count(events) == 2
    assert Enum.at(events, 0).status == "started"
    assert Enum.at(events, 1).status == "succeeded"
    assert Enum.at(events, 1).stdout == "hello-world"

    updated_command_job = Scheduler.get_command_job!(command_job.id)
    assert updated_command_job.shell_command == "printf 'hello-world'"
    assert updated_command_job.started_at
    assert updated_command_job.finished_at
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

    Scheduler.create_command_schedule_environment!(%{
      command_schedule_id: command_schedule.id,
      environment_id: environment.id
    })

    Scheduler.create_command_schedule_cron!(%{
      command_schedule_id: command_schedule.id,
      cron_id: cron.id
    })

    command_job =
      Scheduler.create_command_job!(%{
        command_id: command.id,
        environment_id: environment.id,
        cron_id: cron.id,
        oban_job_id: 102
      })

    assert {:error, _message} =
             RunCommand.perform(%Oban.Job{
               id: 102,
               args: %{"command_job_id" => command_job.id}
             })

    events =
      Scheduler.list_command_job_events!(query: [filter: [command_job_id: command_job.id], sort: [started_at: :asc]])

    assert Enum.count(events) == 2
    assert Enum.at(events, 0).status == "started"
    assert Enum.at(events, 1).status == "failed"
    assert Enum.at(events, 1).stderr =~ "boom"

    updated_command_job = Scheduler.get_command_job!(command_job.id)
    assert updated_command_job.shell_command == "printf 'boom' 1>&2; exit 42"
    assert updated_command_job.started_at
    assert updated_command_job.finished_at
  end
end
