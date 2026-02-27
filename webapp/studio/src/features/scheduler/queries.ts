import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  buildAuthHeaders,
} from "@/lib/auth";

import {
  buildCSRFHeaders,
  createCommand,
  createCommandSchedule,
  createCommandScheduleCron,
  createCommandScheduleEnvironment,
  createCron,
  createEnvironment,
  createVariable,
  createVariableEnvironment,
  destroyVariableEnvironment,
  destroyCommandScheduleCron,
  destroyCommandScheduleEnvironment,
  listCommandJobEvents,
  listCommandScheduleCrons,
  listCommandScheduleEnvironments,
  listCommandSchedules,
  listCommands,
  listCrons,
  listEnvironments,
  listVariableEnvironments,
  listVariables,
  updateCommand,
  updateCron,
  updateEnvironment,
  updateVariable,
} from "@/lib/ash_rpc";

const rpcHeaders = () => buildAuthHeaders(buildCSRFHeaders());

const rpcErrorMessage = (errors: Array<{ shortMessage: string; message: string }>) =>
  errors.map((error) => error.shortMessage || error.message).join(", ");

const asArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === "object" && Array.isArray((value as { results?: unknown[] }).results)) {
    return (value as { results: T[] }).results;
  }

  return [];
};

export type EnvironmentRow = {
  id: string;
  name: string;
  enabled: boolean;
};

export type CronRow = {
  id: string;
  name: string;
  crontabExpression: string;
  enabled: boolean;
};

export type VariableRow = {
  id: string;
  name: string;
  description: string | null;
  value: string | null;
  secretValue: string | null;
};

export type VariableAssignmentRow = {
  id: string;
  variableId: string;
  variable?: {
    id: string;
    name: string;
    description?: string | null;
  };
  environmentId: string;
  environment?: {
    id: string;
    name: string;
    enabled: boolean;
  };
};

export type CommandRow = {
  id: string;
  name: string;
  shellCommand: string;
  enabled: boolean;
  timeoutMs: number;
};

export type CommandScheduleRow = {
  id: string;
  commandId: string;
  command?: {
    id: string;
    name: string;
    enabled: boolean;
  };
  commandScheduleEnvironments: Array<{
    id: string;
    environmentId: string;
    environment?: {
      id: string;
      name: string;
      enabled: boolean;
    };
  }>;
  commandScheduleCrons: Array<{
    id: string;
    cronId: string;
    cron?: {
      id: string;
      name: string;
      crontabExpression: string;
    };
  }>;
};

export type ExecutionEventRow = {
  id: string;
  status: string;
  startedAt: string;
  durationMs: number | null;
  stdout: string;
  stderr: string;
  commandJobId: string;
  shellCommand: string;
  cronExpression: string;
  commandId: string;
  command?: {
    id: string;
    name: string;
  };
};

export type CreateEnvironmentPayload = {
  name: string;
  enabled: boolean;
};

export type UpdateEnvironmentPayload = {
  id: string;
  name?: string;
  enabled?: boolean;
};

export type CreateCronPayload = {
  name: string;
  crontabExpression: string;
  enabled: boolean;
};

export type UpdateCronPayload = {
  id: string;
  name?: string;
  crontabExpression?: string;
  enabled?: boolean;
};

export type CreateVariablePayload = {
  name: string;
  description?: string | null;
  value?: string;
  secretValue?: string;
};

export type CreateVariableAssignmentPayload = {
  variableId: string;
  environmentId: string;
};

export type UpdateVariablePayload = {
  id: string;
  name?: string;
  description?: string | null;
  value?: string;
  secretValue?: string;
};

export type RemoveVariableAssignmentPayload = {
  id: string;
};

export type CreateCommandPayload = {
  name: string;
  shellCommand: string;
  enabled: boolean;
  timeoutMs: number;
};

export type UpdateCommandPayload = {
  id: string;
  name?: string;
  shellCommand?: string;
  enabled?: boolean;
  timeoutMs?: number;
};

export type CreateCommandSchedulePayload = {
  commandId: string;
  environmentIds: string[];
  cronIds: string[];
};

export function useEnvironmentsQuery() {
  return useQuery({
    queryKey: ["scheduler", "environments"],
    queryFn: async () => {
      const result = await listEnvironments({
        fields: ["id", "name", "enabled"],
        sort: "name",
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      return result.data as EnvironmentRow[];
    },
  });
}

export function useCronsQuery() {
  return useQuery({
    queryKey: ["scheduler", "crons"],
    queryFn: async () => {
      const result = await listCrons({
        fields: ["id", "name", "crontabExpression", "enabled"],
        sort: "name",
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      return result.data as CronRow[];
    },
  });
}

export function useVariablesQuery() {
  return useQuery({
    queryKey: ["scheduler", "variables"],
    queryFn: async () => {
      const result = await listVariables({
        fields: ["id", "name", "description", "value", "secretValue"],
        sort: "name",
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      return result.data as VariableRow[];
    },
  });
}

export function useVariableAssignmentsQuery() {
  return useQuery({
    queryKey: ["scheduler", "variable-assignments"],
    queryFn: async () => {
      const result = await listVariableEnvironments({
        fields: [
          "id",
          "variableId",
          "environmentId",
          { variable: ["id", "name", "description"] },
          { environment: ["id", "name", "enabled"] },
        ],
        sort: "id",
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      return asArray<{
        id: string;
        variableId: string;
        environmentId: string;
        variable?: { id: string; name: string; description?: string | null };
        environment?: { id: string; name: string; enabled: boolean };
      }>(result.data).map((row) => ({
        id: row.id,
        variableId: row.variableId,
        variable: row.variable,
        environmentId: row.environmentId,
        environment: row.environment,
      }));
    },
  });
}

export function useCommandsQuery() {
  return useQuery({
    queryKey: ["scheduler", "commands"],
    queryFn: async () => {
      const result = await listCommands({
        fields: ["id", "name", "shellCommand", "enabled", "timeoutMs"],
        sort: "name",
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      return result.data as CommandRow[];
    },
  });
}

export function useCommandSchedulesQuery() {
  return useQuery({
    queryKey: ["scheduler", "command-schedules"],
    queryFn: async () => {
      const result = await listCommandSchedules({
        fields: [
          "id",
          "commandId",
          { command: ["id", "name", "enabled"] },
          {
            commandScheduleEnvironments: [
              "id",
              "environmentId",
              { environment: ["id", "name", "enabled"] },
            ],
          },
          {
            commandScheduleCrons: [
              "id",
              "cronId",
              { cron: ["id", "name", "crontabExpression"] },
            ],
          },
        ],
        sort: "id",
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      return asArray<CommandScheduleRow>(result.data).map((schedule) => ({
        ...schedule,
        commandScheduleEnvironments: asArray<CommandScheduleRow["commandScheduleEnvironments"][number]>(
          schedule.commandScheduleEnvironments,
        ),
        commandScheduleCrons: asArray<CommandScheduleRow["commandScheduleCrons"][number]>(
          schedule.commandScheduleCrons,
        ),
      }));
    },
  });
}

export function useExecutionEventsQuery(limit = 250) {
  return useQuery({
    queryKey: ["scheduler", "execution-events", limit],
    queryFn: async () => {
      const result = await listCommandJobEvents({
        fields: [
          "id",
          "status",
          "startedAt",
          "durationMs",
          "stdout",
          "stderr",
          "commandJobId",
          {
            commandJob: [
              "id",
              "commandId",
              "shellCommand",
              "cronExpression",
              { command: ["id", "name"] },
            ],
          },
        ],
        sort: "-createdAt",
        page: { limit },
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      const data =
        (Array.isArray(result.data)
          ? result.data
          : (result.data as { results?: unknown[] }).results ?? []) as Array<{
          id: string;
          status: string;
          startedAt: string;
          durationMs: number | null;
          stdout: string;
          stderr: string;
          commandJobId: string;
          commandJob?: {
            commandId: string;
            shellCommand: string;
            cronExpression: string;
            command?: {
              id: string;
              name: string;
            };
          };
        }>;

      return data.map((event) => ({
        id: event.id,
        status: event.status,
        startedAt: event.startedAt,
        durationMs: event.durationMs,
        stdout: event.stdout,
        stderr: event.stderr,
        commandJobId: event.commandJobId,
        shellCommand: event.commandJob?.shellCommand ?? "",
        cronExpression: event.commandJob?.cronExpression ?? "",
        commandId: event.commandJob?.commandId ?? "",
        command: event.commandJob?.command,
      }));
    },
  });
}

export function useCreateEnvironmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEnvironmentPayload) => {
      const result = await createEnvironment({
        input,
        fields: ["id", "name", "enabled"],
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scheduler"] });
    },
  });
}

export function useUpdateEnvironmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateEnvironmentPayload) => {
      const result = await updateEnvironment({
        identity: id,
        input,
        fields: ["id", "name", "enabled"],
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scheduler"] });
    },
  });
}

export function useCreateCronMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCronPayload) => {
      const result = await createCron({
        input,
        fields: ["id", "name", "crontabExpression", "enabled"],
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scheduler"] });
    },
  });
}

export function useUpdateCronMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateCronPayload) => {
      const result = await updateCron({
        identity: id,
        input,
        fields: ["id", "name", "crontabExpression", "enabled"],
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scheduler"] });
    },
  });
}

export function useCreateVariableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateVariablePayload) => {
      const result = await createVariable({
        input,
        fields: ["id", "name", "description", "value", "secretValue"],
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scheduler"] });
    },
  });
}

export function useCreateVariableAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ variableId, environmentId }: CreateVariableAssignmentPayload) => {
      const result = await createVariableEnvironment({
        input: {
          variableId,
          environmentId,
        },
        fields: ["id", "variableId", "environmentId"],
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scheduler"] });
    },
  });
}

export function useUpdateVariableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateVariablePayload) => {
      const result = await updateVariable({
        identity: id,
        input,
        fields: ["id", "name", "description", "value", "secretValue"],
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scheduler"] });
    },
  });
}

export function useRemoveVariableAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: RemoveVariableAssignmentPayload) => {
      const result = await destroyVariableEnvironment({
        identity: id,
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scheduler"] });
    },
  });
}

export function useCreateCommandMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCommandPayload) => {
      const result = await createCommand({
        input,
        fields: ["id", "name", "shellCommand", "enabled", "timeoutMs"],
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scheduler"] });
    },
  });
}

export function useUpdateCommandMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateCommandPayload) => {
      const result = await updateCommand({
        identity: id,
        input,
        fields: ["id", "name", "shellCommand", "enabled", "timeoutMs"],
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scheduler"] });
    },
  });
}

export function useCreateCommandScheduleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commandId, environmentIds, cronIds }: CreateCommandSchedulePayload) => {
      const existingSchedulesResult = await listCommandSchedules({
        fields: [
          "id",
          "commandId",
          { commandScheduleEnvironments: ["id", "environmentId"] },
          { commandScheduleCrons: ["id", "cronId"] },
        ],
        filter: { commandId: { eq: commandId } },
        sort: "id",
        headers: rpcHeaders(),
      });

      if (!existingSchedulesResult.success) {
        throw new Error(rpcErrorMessage(existingSchedulesResult.errors));
      }

      type ExistingSchedule = {
        id: string;
        commandId: string;
      };

      const existingSchedules = asArray<ExistingSchedule>(existingSchedulesResult.data);

      const schedule =
        existingSchedules[0] ??
        (await (async () => {
          const scheduleResult = await createCommandSchedule({
            input: { commandId },
            fields: ["id", "commandId"],
            headers: rpcHeaders(),
          });

          if (!scheduleResult.success) {
            throw new Error(rpcErrorMessage(scheduleResult.errors));
          }

          return scheduleResult.data as ExistingSchedule;
        })());

      const existingEnvironmentLinksResult = await listCommandScheduleEnvironments({
        fields: ["id", "environmentId"],
        filter: { commandScheduleId: { eq: schedule.id } },
        headers: rpcHeaders(),
      });

      if (!existingEnvironmentLinksResult.success) {
        throw new Error(rpcErrorMessage(existingEnvironmentLinksResult.errors));
      }

      const existingCronLinksResult = await listCommandScheduleCrons({
        fields: ["id", "cronId"],
        filter: { commandScheduleId: { eq: schedule.id } },
        headers: rpcHeaders(),
      });

      if (!existingCronLinksResult.success) {
        throw new Error(rpcErrorMessage(existingCronLinksResult.errors));
      }

      const uniqueEnvironmentIds = [...new Set(environmentIds)];
      const uniqueCronIds = [...new Set(cronIds)];
      const existingEnvironmentLinks = asArray<{ id: string; environmentId: string }>(
        existingEnvironmentLinksResult.data,
      );
      const existingCronLinks = asArray<{ id: string; cronId: string }>(existingCronLinksResult.data);
      const existingEnvironmentIds = new Set(existingEnvironmentLinks.map((entry) => entry.environmentId));
      const existingCronIds = new Set(existingCronLinks.map((entry) => entry.cronId));

      const missingEnvironmentIds = uniqueEnvironmentIds.filter(
        (environmentId) => !existingEnvironmentIds.has(environmentId),
      );
      const missingCronIds = uniqueCronIds.filter((cronId) => !existingCronIds.has(cronId));
      const obsoleteEnvironmentLinks = existingEnvironmentLinks.filter(
        (entry) => !uniqueEnvironmentIds.includes(entry.environmentId),
      );
      const obsoleteCronLinks = existingCronLinks.filter((entry) => !uniqueCronIds.includes(entry.cronId));

      const environmentResults = await Promise.all(
        missingEnvironmentIds.map((environmentId) =>
          createCommandScheduleEnvironment({
            input: { commandScheduleId: schedule.id, environmentId },
            fields: ["id", "commandScheduleId", "environmentId"],
            headers: rpcHeaders(),
          }),
        ),
      );

      const environmentError = environmentResults.find((result) => !result.success);
      if (environmentError && !environmentError.success) {
        throw new Error(rpcErrorMessage(environmentError.errors));
      }

      const environmentDeleteResults = await Promise.all(
        obsoleteEnvironmentLinks.map((entry) =>
          destroyCommandScheduleEnvironment({
            identity: entry.id,
            headers: rpcHeaders(),
          }),
        ),
      );

      const environmentDeleteError = environmentDeleteResults.find((result) => !result.success);
      if (environmentDeleteError && !environmentDeleteError.success) {
        throw new Error(rpcErrorMessage(environmentDeleteError.errors));
      }

      const cronResults = await Promise.all(
        missingCronIds.map((cronId) =>
          createCommandScheduleCron({
            input: { commandScheduleId: schedule.id, cronId },
            fields: ["id", "commandScheduleId", "cronId"],
            headers: rpcHeaders(),
          }),
        ),
      );

      const cronError = cronResults.find((result) => !result.success);
      if (cronError && !cronError.success) {
        throw new Error(rpcErrorMessage(cronError.errors));
      }

      const cronDeleteResults = await Promise.all(
        obsoleteCronLinks.map((entry) =>
          destroyCommandScheduleCron({
            identity: entry.id,
            headers: rpcHeaders(),
          }),
        ),
      );

      const cronDeleteError = cronDeleteResults.find((result) => !result.success);
      if (cronDeleteError && !cronDeleteError.success) {
        throw new Error(rpcErrorMessage(cronDeleteError.errors));
      }

      return schedule;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scheduler"] });
    },
  });
}
