defmodule Cs.Scheduler.Workers.DispatchDueCommandsTest do
  use Cs.DataCase, async: true
  use Oban.Testing, repo: Cs.Repo

  alias Cs.Scheduler
  alias Cs.Scheduler.Workers.DispatchDueCommands
  alias Cs.Scheduler.Workers.RunCommand

  test "perform enqueues due schedules for enabled environments only" do
    command = create_command()
    enabled_environment = create_environment(true)
    disabled_environment = create_environment(false)
    cron = create_cron("* * * * *")
    command_schedule = Scheduler.create_command_schedule!(%{command_id: command.id})

    Scheduler.create_command_schedule_environment!(%{
      command_schedule_id: command_schedule.id,
      environment_id: enabled_environment.id
    })

    Scheduler.create_command_schedule_environment!(%{
      command_schedule_id: command_schedule.id,
      environment_id: disabled_environment.id
    })

    Scheduler.create_command_schedule_cron!(%{
      command_schedule_id: command_schedule.id,
      cron_id: cron.id
    })

    assert :ok = DispatchDueCommands.perform(%Oban.Job{})

    command_jobs =
      Scheduler.list_command_jobs!(query: [filter: [command_id: command.id, cron_id: cron.id]])

    assert Enum.count(command_jobs) == 1
    command_job = Enum.at(command_jobs, 0)

    assert command_job.environment_id == enabled_environment.id
    assert command_job.oban_job_id
    assert command_job.shell_command == command.shell_command
    assert command_job.cron_expression == cron.crontab_expression

    assert_enqueued(worker: RunCommand, args: %{"command_job_id" => command_job.id})

    disabled_environment_jobs =
      Scheduler.list_command_jobs!(query: [filter: [command_id: command.id, environment_id: disabled_environment.id]])

    assert disabled_environment_jobs == []
  end

  test "perform skips disabled commands" do
    command = create_command(false)
    environment = create_environment(true)
    cron = create_cron("* * * * *")
    command_schedule = Scheduler.create_command_schedule!(%{command_id: command.id})

    Scheduler.create_command_schedule_environment!(%{
      command_schedule_id: command_schedule.id,
      environment_id: environment.id
    })

    Scheduler.create_command_schedule_cron!(%{
      command_schedule_id: command_schedule.id,
      cron_id: cron.id
    })

    assert :ok = DispatchDueCommands.perform(%Oban.Job{})

    refute_enqueued(worker: RunCommand)
  end

  test "perform skips disabled command schedules" do
    command = create_command(true)
    environment = create_environment(true)
    cron = create_cron("* * * * *")

    command_schedule =
      Scheduler.create_command_schedule!(%{command_id: command.id, enabled: false})

    Scheduler.create_command_schedule_environment!(%{
      command_schedule_id: command_schedule.id,
      environment_id: environment.id
    })

    Scheduler.create_command_schedule_cron!(%{
      command_schedule_id: command_schedule.id,
      cron_id: cron.id
    })

    assert :ok = DispatchDueCommands.perform(%Oban.Job{})

    refute_enqueued(worker: RunCommand)
    assert Scheduler.list_command_jobs!() == []
  end

  test "perform skips disabled crons" do
    command = create_command(true)
    environment = create_environment(true)
    cron = create_cron("* * * * *", false)
    command_schedule = Scheduler.create_command_schedule!(%{command_id: command.id})

    Scheduler.create_command_schedule_environment!(%{
      command_schedule_id: command_schedule.id,
      environment_id: environment.id
    })

    Scheduler.create_command_schedule_cron!(%{
      command_schedule_id: command_schedule.id,
      cron_id: cron.id
    })

    assert :ok = DispatchDueCommands.perform(%Oban.Job{})

    refute_enqueued(worker: RunCommand)
    assert Scheduler.list_command_jobs!() == []
  end

  defp create_environment(enabled) do
    Scheduler.create_environment!(%{
      name: "dispatch-env-#{System.unique_integer([:positive])}",
      enabled: enabled
    })
  end

  defp create_command(enabled \\ true) do
    Scheduler.create_command!(%{
      name: "dispatch-command-#{System.unique_integer([:positive])}",
      shell_command: "echo ok",
      enabled: enabled,
      timeout_ms: 5_000
    })
  end

  defp create_cron(expression, enabled \\ true) do
    Scheduler.create_cron!(%{
      name: "dispatch-cron-#{System.unique_integer([:positive])}",
      crontab_expression: expression,
      enabled: enabled
    })
  end
end
