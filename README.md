# Command Studio

This project was built using an AI (Codex GPT 3.5 Medium) primarily using Elixir, Ash, and React.

## Technologies

- [Elixir](https://elixir-lang.org/)
  - [Phoenix](https://www.phoenixframework.org/)
  - [LiveView](https://hexdocs.pm/phoenix_live_view/) for admin UI
  - [Ash](https://ash-hq.org/): Define your model, derive the rest -- including paginated remote queries and countless other table stakes
  - [Ash Postgres](https://hexdocs.pm/ash_postgres/) for persistence
  - [Ash Authentication](https://hexdocs.pm/ash_authentication/)
  - [Oban](https://oban.pro/) for robust job execution
- [ReactJS](https://react.dev/)
  - [TanStack Start](https://tanstack.com/start/)
  - [TanStack Query](https://tanstack.com/query/)
  - [shadcn/ui](https://shadcn-ui.com/) for UI components
  - Embeds [Oban Web](https://getoban.pro/) via an IFrame
  - Communicates with Phoenix/Ash backend via [Ash TypeScript](https://hexdocs.pm/ash_typescript) - As far as the app is concerned, it's TypeScript All the Way Down!

## Purpose

This project implements an operations dashboard for the scheduled execution of remote jobs with the optional ability to pass secrets to them. Secrets are encrypted at rest.

The main tasks of the React-based application is to:

- Defining execution commands (shell scripts)
- Defining execution environments
- Managing encrypted secrets that can be embedded into commands securely
  - They don't appear, for example, in history files or `ps`
- Scheduling commands to run on specified environments using crontab expressions
- Command execution with retry and timeout enforcement via Oban
- Inspecting command execution events with filters and pagination

![Command Studio UI](docs/images/scheduler-ux.png)

## Installation

### 1. Install Postgres

### 2. Install Elixir and Erlang/OTP

This project runs on Phoenix + Ash, so Elixir/Erlang are required first.

```bash
brew install elixir
```

Verify:

```bash
elixir --version
mix --version
```

### 3. Install nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

Reload your shell:

```bash
source ~/.nvm/nvm.sh
```

### 4. Clone the repository

```bash
git clone https://github.com/dev-guy/CommandStudio.git
cd CommandStudio
```

### 5. Install NodeJS

```bash
nvm install
nvm use
node -v
```

### 6. Install dependencies

Backend:

```bash
cd phoenix
mix deps.get
```

Frontend:

```bash
cd webapp/studio
npm install
```

### 7. Prepare the database

```bash
cd phoenix
mix setup
```

### 8. Run the app

Start Phoenix:

```bash
cd phoenix
mix phx.server
```

Run the React UI:

```bash
cd webapp/studio
npm run dev
```

## Usage

Go to:
- [CommandStudio]http://localhost:5173)
- [Ash Admin](http://localhost:4000/admin)
- [Oban Web](http://localhost:4000/oban)

## Why Oban

Oban is robust and has a fantastic operational UI. It has the following benefits that took years to perfect:

- Durability: jobs are persisted in Postgres, so work survives restarts
- Reliability: retries, backoff, and failure tracking are built in
- Observability: Oban Web provides real-time queue and job introspection
- Control: queue-level tuning and worker isolation keep execution predictable
- It works with Ecto/Postgres

### Ash + Oban Colaboration

See the Mermaid sequence document: [docs/ash-oban-sequence.md](docs/ash-oban-sequence.md)

This project doesn't use an Ash generic action to queue jobs to Oban. Therefore, Ash Oban isn't used. This decision was made by Codex. More thought should be put into how generic Ash action could call the function that checks for scheduled jobs to execute.

## AI-Assisted Development

- The following MCP server are recommended:
  - [DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)
  - [Tidewave MCP](https://github.com/tidewave-ai/tidewave)
- "boot" your AI Assistant by instructing it to read [ai/boot.md](ai/boot.md)

### Creation

The following documents were generated with ChatGPT 5.3 and then fed into Codex:

- [PRD](ai/prd.md)
- [Architecture](ai/architecture.md)
- [Development Plan](ai/devplan.md)

It's worth noting that development did not start until after AGENTS.md was generated via [usage_rules](https://hexdocs.pm/usage_rules).

To build the React app, we didn't run TanStack Start manually (Codex ran it for me) but manual installation is recommended. We also didn't specify using `class-variance-authority`. Models already know about it.

