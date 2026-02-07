defmodule Cns.Scheduler.Workers.DispatchDueCommandsTest do
  use Cns.DataCase, async: true
  use Oban.Testing, repo: Cns.Repo

  alias Cns.Scheduler
  alias Cns.Scheduler.Workers.DispatchDueCommands
  alias Cns.Scheduler.Workers.RunCommand

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

    assert_enqueued(
      worker: RunCommand,
      args: %{"command_id" => command.id, "environment_id" => enabled_environment.id}
    )

    refute_enqueued(
      worker: RunCommand,
      args: %{"command_id" => command.id, "environment_id" => disabled_environment.id}
    )
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

    refute_enqueued(
      worker: RunCommand,
      args: %{"command_id" => command.id, "environment_id" => environment.id}
    )
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

  defp create_cron(expression) do
    Scheduler.create_cron!(%{
      name: "dispatch-cron-#{System.unique_integer([:positive])}",
      crontab_expression: expression
    })
  end
end
