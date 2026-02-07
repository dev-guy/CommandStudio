# Implementation Guide
## Step-by-Step Instructions for Coding Agent

## Phase 1: Backend Foundations
1. Initialize Elixir project with Ash and Ash Postgres.
2. Install and configure Ash Encryption.
3. Add Oban and Oban Web.

## Phase 2: Domain Modeling
4. Create Ash resource: Environment.
5. Create Ash resource: Variable.
   - Attributes: name, encrypted_value, environment_id.
6. Create Ash resource: Command.
   - Attributes: name, shell_command, cron_expression, environment_id.
7. Create Ash resource: CommandExecutionEvent.
   - Attributes: command_id, status, started_at, finished_at, duration_ms, stdout, stderr.

## Phase 3: Scheduling Integration
8. Configure Oban with crontab support.
9. Implement Ash action to sync Command.cron_expression to Oban crontab.
10. Ensure updates re-register schedules dynamically.

## Phase 4: Job Execution
11. Implement Oban Worker:
    - Load Command by ID.
    - Resolve variables for environment.
    - Interpolate $VARIABLE references.
    - Execute shell command using System.cmd or Port.
    - Capture stdout and stderr separately.
    - Measure execution time.
    - Emit CommandExecutionEvent records for:
      - started
      - succeeded
      - failed

## Phase 5: Frontend
12. Initialize React app with shadcn/ui.
13. Integrate Ash TypeScript client.
14. Build UI screens:
    - Environments
    - Variables / Secrets
    - Commands + Schedule Editor
    - Execution History

## Phase 6: Validation & Hardening
15. Ensure secrets never logged.
16. Add retry and timeout handling in workers.
17. Verify Oban Web visibility.
18. Add indexes on execution events.

## Phase 7: Agent Automation
19. Encode all steps as tasks for coding agent.
20. Enforce no REST endpoints — Ash resources only.
