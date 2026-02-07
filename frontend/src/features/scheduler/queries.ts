import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  buildCSRFHeaders,
  createCommand,
  createCommandSchedule,
  createCommandScheduleCron,
  createCommandScheduleEnvironment,
  createCron,
  createEnvironment,
  createVariable,
  listCommandExecutionEvents,
  listCommandSchedules,
  listCommands,
  listCrons,
  listEnvironments,
  listVariables,
  updateCommand,
  updateCron,
  updateEnvironment,
  updateVariable,
} from "@/lib/ash_rpc";

const rpcHeaders = () => buildCSRFHeaders();

const rpcErrorMessage = (errors: Array<{ shortMessage: string; message: string }>) =>
  errors.map((error) => error.shortMessage || error.message).join(", ");

export type EnvironmentRow = {
  id: string;
  name: string;
  enabled: boolean;
};

export type CronRow = {
  id: string;
  name: string;
  crontabExpression: string;
};

export type VariableRow = {
  id: string;
  name: string;
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
};

export type UpdateCronPayload = {
  id: string;
  name?: string;
  crontabExpression?: string;
};

export type CreateVariablePayload = {
  name: string;
  value: string;
  environmentId: string;
};

export type UpdateVariablePayload = {
  id: string;
  name?: string;
  value?: string;
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
        fields: ["id", "name", "crontabExpression"],
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
        fields: ["id", "name", "environmentId", { environment: ["id", "name", "enabled"] }],
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

      return result.data as CommandScheduleRow[];
    },
  });
}

export function useExecutionEventsQuery() {
  return useQuery({
    queryKey: ["scheduler", "execution-events"],
    queryFn: async () => {
      const result = await listCommandExecutionEvents({
        fields: [
          "id",
          "status",
          "startedAt",
          "durationMs",
          "stdout",
          "stderr",
          "commandId",
          { command: ["id", "name"] },
        ],
        sort: "startedAt",
        page: { limit: 25 },
        headers: rpcHeaders(),
      });

      if (!result.success) {
        throw new Error(rpcErrorMessage(result.errors));
      }

      const data = result.data as ExecutionEventRow[] | { results?: ExecutionEventRow[] };
      return Array.isArray(data) ? data : data.results ?? [];
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
        fields: ["id", "name", "crontabExpression"],
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
        fields: ["id", "name", "crontabExpression"],
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
        fields: ["id", "name", "environmentId"],
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
        fields: ["id", "name", "environmentId"],
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
      const scheduleResult = await createCommandSchedule({
        input: { commandId },
        fields: ["id", "commandId"],
        headers: rpcHeaders(),
      });

      if (!scheduleResult.success) {
        throw new Error(rpcErrorMessage(scheduleResult.errors));
      }

      const schedule = scheduleResult.data;
      const uniqueEnvironmentIds = [...new Set(environmentIds)];
      const uniqueCronIds = [...new Set(cronIds)];

      const environmentResults = await Promise.all(
        uniqueEnvironmentIds.map((environmentId) =>
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

      const cronResults = await Promise.all(
        uniqueCronIds.map((cronId) =>
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

      return schedule;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scheduler"] });
    },
  });
}
