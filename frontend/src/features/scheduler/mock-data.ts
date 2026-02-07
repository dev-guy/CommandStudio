export type Environment = {
  id: string;
  name: string;
  region: string;
  updatedAt: string;
  secretCount: number;
};

export type SchedulerCommand = {
  id: string;
  name: string;
  cronExpression: string;
  environment: string;
  timeoutMs: number;
  lastRunStatus: "success" | "failed" | "running";
  lastDurationMs: number;
};

export type ExecutionEvent = {
  id: string;
  commandName: string;
  startedAt: string;
  durationMs: number;
  status: "success" | "failed";
  stdoutPreview: string;
};

export type SecretVariable = {
  id: string;
  name: string;
  environment: string;
  updatedBy: string;
  updatedAt: string;
};

export const environments: Environment[] = [
  {
    id: "env_prod",
    name: "Production",
    region: "us-east-1",
    updatedAt: "2m ago",
    secretCount: 18,
  },
  {
    id: "env_staging",
    name: "Staging",
    region: "us-east-2",
    updatedAt: "11m ago",
    secretCount: 10,
  },
  {
    id: "env_qa",
    name: "QA",
    region: "us-west-2",
    updatedAt: "25m ago",
    secretCount: 7,
  },
];

export const commands: SchedulerCommand[] = [
  {
    id: "cmd_billing",
    name: "nightly-billing-sync",
    cronExpression: "0 2 * * *",
    environment: "Production",
    timeoutMs: 240000,
    lastRunStatus: "success",
    lastDurationMs: 41290,
  },
  {
    id: "cmd_cache",
    name: "cache-prime",
    cronExpression: "*/15 * * * *",
    environment: "Staging",
    timeoutMs: 60000,
    lastRunStatus: "running",
    lastDurationMs: 0,
  },
  {
    id: "cmd_cleanup",
    name: "artifact-cleanup",
    cronExpression: "30 3 * * 0",
    environment: "QA",
    timeoutMs: 300000,
    lastRunStatus: "failed",
    lastDurationMs: 128500,
  },
];

export const executionEvents: ExecutionEvent[] = [
  {
    id: "ev_701",
    commandName: "nightly-billing-sync",
    startedAt: "2026-02-07 02:00:00 UTC",
    durationMs: 41290,
    status: "success",
    stdoutPreview: "Synced 48,420 invoices",
  },
  {
    id: "ev_702",
    commandName: "artifact-cleanup",
    startedAt: "2026-02-07 03:30:00 UTC",
    durationMs: 128500,
    status: "failed",
    stdoutPreview: "permission denied on /tmp/archive",
  },
  {
    id: "ev_703",
    commandName: "cache-prime",
    startedAt: "2026-02-07 06:00:00 UTC",
    durationMs: 19110,
    status: "success",
    stdoutPreview: "Warmed 132 endpoints",
  },
];

export const secretVariables: SecretVariable[] = [
  {
    id: "var_db_url",
    name: "DATABASE_URL",
    environment: "Production",
    updatedBy: "ops@company.com",
    updatedAt: "2026-02-07 01:52 UTC",
  },
  {
    id: "var_api_key",
    name: "THIRD_PARTY_API_KEY",
    environment: "Staging",
    updatedBy: "devops@company.com",
    updatedAt: "2026-02-06 18:34 UTC",
  },
  {
    id: "var_slack",
    name: "SLACK_WEBHOOK",
    environment: "QA",
    updatedBy: "qa@company.com",
    updatedAt: "2026-02-06 12:16 UTC",
  },
];
