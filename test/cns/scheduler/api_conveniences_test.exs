defmodule Cns.Scheduler.ApiConveniencesTest do
  use Cns.DataCase, async: true
  use Oban.Testing, repo: Cns.Repo

  alias Cns.Scheduler

  test "list_events_for_command returns events for only the selected command" do
    environment = create_environment()
    command_one = create_command(environment.id, "list-events-one")
    command_two = create_command(environment.id, "list-events-two")

    now = DateTime.utc_now() |> DateTime.truncate(:second)

    Scheduler.create_command_execution_event!(%{
      command_id: command_one.id,
      status: "succeeded",
      started_at: now,
      finished_at: now,
      duration_ms: 0,
      stdout: "one",
      stderr: ""
    })

    Scheduler.create_command_execution_event!(%{
      command_id: command_two.id,
      status: "failed",
      started_at: now,
      finished_at: now,
      duration_ms: 0,
      stdout: "",
      stderr: "two"
    })

    events = Scheduler.list_events_for_command!(command_one.id)

    assert Enum.count(events) == 1
    assert Enum.at(events, 0).command_id == command_one.id
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
      args: %{"command_id" => disabled_command.id}
    )
  end

  test "retry actions enqueue a new run from failed events" do
    environment = create_environment()
    command = create_command(environment.id, "retry-command", enabled: false)

    now = DateTime.utc_now() |> DateTime.truncate(:second)

    failed_event =
      Scheduler.create_command_execution_event!(%{
        command_id: command.id,
        status: "failed",
        started_at: now,
        finished_at: now,
        duration_ms: 0,
        stdout: "",
        stderr: "boom"
      })

    assert {:ok, _id} = Scheduler.retry_command_execution_event(failed_event.id)
    assert {:ok, _id} = Scheduler.retry_command_last_failed(command.id)

    assert_enqueued(
      worker: Cns.Scheduler.Workers.RunCommand,
      args: %{"command_id" => command.id}
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
        environment_id: environment_id,
        name: "#{name_prefix}-#{System.unique_integer([:positive])}",
        shell_command: "echo test",
        cron_expression: "* * * * *",
        timeout_ms: 5_000
      })

    Scheduler.create_command!(attrs)
  end
end
