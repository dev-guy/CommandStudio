# Product Requirements Document (PRD)
## Command Scheduler Platform

## 1. Purpose
Provide a system that allows users to configure, schedule, and execute shell-based commands on a recurring schedule, securely manage secrets, and observe execution outcomes over time.

## 2. Goals
- Allow users to define commands with variable placeholders.
- Securely manage secrets per environment.
- Schedule commands using cron expressions.
- Execute commands reliably and repeatedly.
- Capture execution duration, stdout, stderr, and success/failure.
- Provide visibility into historical execution events.

## 3. Non-Goals
- Real-time streaming logs.
- Non-shell command execution (initially).
- Distributed orchestration beyond a single Oban cluster.

## 4. User Personas
- Operator / DevOps user configuring recurring jobs.
- Admin managing secrets and environments.

## 5. Functional Requirements
### Commands
- Define shell commands.
- Reference variables using $VARIABLE syntax.
- Associate with a schedule (cron expression).

### Environments
- Group variables and secrets.
- Support multiple environments (e.g. prod, staging).

### Variables / Secrets
- Named variables referenced by commands.
- Values stored encrypted.
- Editable via UI.

### Scheduling
- Cron-based schedules.
- Dynamic updates reflected without redeploy.

### Execution & Events
- Track job started, completed, failed.
- Capture duration.
- Capture stdout and stderr separately.

## 6. Success Metrics
- Commands execute on schedule.
- Secrets never exposed in plaintext.
- Users can audit past executions reliably.
