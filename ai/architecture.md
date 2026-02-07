# Architecture Document
## Command Scheduler Platform

## 1. Overview
The system consists of:
- A Phoenix LiveView admin interface for operational administration.
- A TanStack Start-based React + shadcn/ui primary product UI.
- An Ash-powered Elixir backend for domain modeling and persistence.
- Oban for reliable background job execution.

## 2. Components

### Frontend (Primary Product UI)
- TanStack Start (React) + shadcn/ui
- TanStack DB
- Ash TypeScript client
- Responsibilities:
  - CRUD for commands, environments, variables
  - Cron schedule configuration
  - Viewing execution history

### Admin Interface
- Phoenix LiveView
- Responsibilities:
  - Administrative workflows and operational controls
  - Internal visibility into scheduler state and system configuration

### Backend (Elixir + Ash)
#### Core Resources
- Environment
- Variable (encrypted)
- Command
- CommandExecutionEvent

#### Extensions
- Ash Encryption for secrets
- Ash Postgres for persistence

### Job Execution (Oban)
- Oban Crontab used for scheduling
- One Oban worker per command type
- Workers fetch latest config at runtime

## 3. Data Flow
1. User updates command/schedule/secrets in UI.
2. React UI uses TanStack DB for query/mutation state, backed by Ash TypeScript client calls.
3. Ash persists changes.
4. Schedule updates trigger crontab refresh.
5. Oban enqueues jobs on schedule.
6. Worker loads command + secrets.
7. Shell command executed.
8. stdout, stderr, duration, status recorded as events.

## 4. Security Model
- Secrets encrypted at rest.
- Secrets resolved only at execution time.
- No secrets stored in Oban job args.

## 5. Observability
- Oban Web for job-level visibility.
- Custom UI for command-centric history.
