defmodule Cns.Scheduler.ApiConveniencesTest do
  use Cns.DataCase, async: true
  use Oban.Testing, repo: Cns.Repo

  alias Cns.Scheduler

  test "list_events_for_command returns events for only the selected command" do
    environment = create_environment()
    command_one = create_command(environment.id, "list-events-one")
    command_two = create_command(environment.id, "list-events-two")
    command_job_one = create_command_job(command_one.id, environment.id)
    command_job_two = create_command_job(command_two.id, environment.id)

    now = DateTime.utc_now() |> DateTime.truncate(:second)

    Scheduler.create_command_job_event!(%{
      command_job_id: command_job_one.id,
      status: "succeeded",
      started_at: now,
      finished_at: now,
      duration_ms: 0,
      stdout: "one",
      stderr: ""
    })

    Scheduler.create_command_job_event!(%{
      command_job_id: command_job_two.id,
      status: "failed",
      started_at: now,
      finished_at: now,
      duration_ms: 0,
      stdout: "",
      stderr: "two"
    })

    events = Scheduler.list_events_for_command!(command_one.id)

    assert Enum.count(events) == 1
    assert Enum.at(events, 0).command_job_id == command_job_one.id
  end

  test "manual trigger variants support delayed and forced execution" do
    environment = create_environment()
    disabled_command = create_command(environment.id, "disabled-command", enabled: false)

    assert {:error, error} = Scheduler.enqueue_command_run(disabled_command.id)
    assert Exception.message(error) =~ "command is disabled"

    assert {:error, delayed_error} = Scheduler.enqueue_command_run_in(disabled_command.id, 30)
    assert Exception.message(delayed_error) =~ "command is disabled"

    assert {:ok, _id} = Scheduler.enqueue_command_run_force(disabled_command.id)

    assert_enqueued(
      worker: Cns.Scheduler.Workers.RunCommand,
      args: %{"command_id" => disabled_command.id, "environment_id" => environment.id}
    )

    command_jobs =
      Scheduler.list_command_jobs!(query: [filter: [command_id: disabled_command.id]])

    assert Enum.count(command_jobs) == 1
    assert Enum.at(command_jobs, 0).environment_id == environment.id
    assert Enum.at(command_jobs, 0).oban_job_id
  end

  test "retry actions enqueue a new run from failed events" do
    environment = create_environment()
    command = create_command(environment.id, "retry-command", enabled: false)
    command_job = create_command_job(command.id, environment.id)

    now = DateTime.utc_now() |> DateTime.truncate(:second)

    failed_event =
      Scheduler.create_command_job_event!(%{
        command_job_id: command_job.id,
        status: "failed",
        started_at: now,
        finished_at: now,
        duration_ms: 0,
        stdout: "",
        stderr: "boom"
      })

    assert {:ok, _id} = Scheduler.retry_command_job_event(failed_event.id)
    assert {:ok, _id} = Scheduler.retry_command_last_failed(command.id)

    assert_enqueued(
      worker: Cns.Scheduler.Workers.RunCommand,
      args: %{"command_id" => command.id, "environment_id" => environment.id}
    )
  end

  defp create_environment do
    Scheduler.create_environment!(%{name: "api-env-#{System.unique_integer([:positive])}"})
  end

  defp create_command(environment_id, name_prefix, attrs \\ []) do
    attrs =
      attrs
      |> Enum.into(%{})
      |> Map.merge(%{
        name: "#{name_prefix}-#{System.unique_integer([:positive])}",
        shell_command: "echo test",
        timeout_ms: 5_000
      })

    command = Scheduler.create_command!(attrs)

    cron =
      Scheduler.create_cron!(%{
        name: "api-cron-#{System.unique_integer([:positive])}",
        crontab_expression: "* * * * *"
      })

    command_schedule = Scheduler.create_command_schedule!(%{command_id: command.id})

    Scheduler.create_command_schedule_environment!(%{
      command_schedule_id: command_schedule.id,
      environment_id: environment_id
    })

    Scheduler.create_command_schedule_cron!(%{
      command_schedule_id: command_schedule.id,
      cron_id: cron.id
    })

    command
  end

  defp create_command_job(command_id, environment_id) do
    Scheduler.create_command_job!(%{
      command_id: command_id,
      environment_id: environment_id,
      oban_job_id: System.unique_integer([:positive])
    })
  end
end
