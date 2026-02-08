# Ash + Oban Sequence

Ash and Oban coordinate to execute commands.

## 1) Every-minute dispatch loop (Oban -> Ash -> Oban)

```mermaid
sequenceDiagram
    autonumber
    participant CronPlugin as "Oban.Plugins.Cron"
    participant Oban as "Oban Queue"
    participant Dispatch as "DispatchDueCommands Worker"
    participant Ash as "Cs.Scheduler (Ash Domain)"
    participant Jobs as "Cs.Scheduler.Jobs"

    CronPlugin->>Oban: Insert DispatchDueCommands job every minute ("* * * * *")
    Oban->>Dispatch: perform(%Oban.Job{})
    Dispatch->>Ash: list_command_schedules(load: command, envs, crons)
    Ash-->>Dispatch: schedules + loaded relationships

    loop Each schedule where command + schedule enabled
      Dispatch->>Dispatch: Parse cron + check Expression.now?(..., now)
      alt Cron is due now and environment enabled
        Dispatch->>Jobs: enqueue_command(command_id, environment_id, cron_id)
        Jobs->>Ash: get_command/get_environment + create_command_job(...)
        Ash-->>Jobs: command_job created
        Jobs->>Oban: Oban.insert(RunCommand.new(%{command_job_id}))
        Oban-->>Jobs: oban_job id
        Jobs->>Ash: update_command_job(command_job_id, %{oban_job_id: ...})
      else Not due / disabled
        Dispatch-->>Dispatch: Skip
      end
    end
```

## 2) Ash action path (Ash -> Oban queue)

```mermaid
sequenceDiagram
    autonumber
    participant UI as "React UI / RPC Client"
    participant AshAction as "Ash Resource Action (Command / CommandJobEvent)"
    participant Jobs as "Cs.Scheduler.Jobs"
    participant Ash as "Cs.Scheduler (Ash Domain)"
    participant Oban as "Oban Queue"
    participant Run as "RunCommand Worker"
    participant Runner as "CommandRunner"

    UI->>AshAction: enqueue_command_run / enqueue_command_run_in / retry_...
    AshAction->>Jobs: Jobs.enqueue_command(command_id, opts)
    Jobs->>Ash: create_command_job(...)
    Ash-->>Jobs: command_job id
    Jobs->>Oban: Oban.insert(RunCommand.new(%{command_job_id}))
    Oban-->>Jobs: queued job id
    Jobs->>Ash: update_command_job(oban_job_id)
    AshAction-->>UI: success

    Oban->>Run: perform(%Oban.Job{args: %{command_job_id}})
    Run->>Ash: get_command_job + get_command + get_environment(load: variables)
    Run->>Ash: create_command_job_event(status: "started")
    Run->>Runner: run(rendered_shell_command, env_pairs, timeout_ms)
    Runner-->>Run: {:ok, ...} or {:error, ...}
    Run->>Ash: update_command_job(started_at/finished_at)
    Run->>Ash: create_command_job_event(status: "succeeded"/"failed", stdout/stderr, duration)
```

## Where this behavior is configured in code

- Minute wake-up: `config/config.exs` (`Oban.Plugins.Cron`, `"* * * * *"`)
- Dispatch worker: `phoenix/lib/cs/scheduler/workers/dispatch_due_commands.ex`
- Enqueue bridge (Ash -> Oban): `phoenix/lib/cs/scheduler/jobs.ex`
- Ash actions that queue jobs: `phoenix/lib/cs/scheduler/command.ex`, `phoenix/lib/cs/scheduler/command_job_event.ex`
- Execution worker: `phoenix/lib/cs/scheduler/workers/run_command.ex`

