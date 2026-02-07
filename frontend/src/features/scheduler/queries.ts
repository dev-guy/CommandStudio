import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  buildCSRFHeaders,
  createCommand,
  createEnvironment,
  createVariable,
  listCommandExecutionEvents,
  listCommands,
  listEnvironments,
  listVariables,
  updateCommand,
  updateEnvironment,
  updateVariable,
} from "@/lib/ash_rpc";

const rpcHeaders = () => buildCSRFHeaders();

const rpcErrorMessage = (errors: Array<{ shortMessage: string; message: string }>) =>
  errors.map((error) => error.shortMessage || error.message).join(", ");

export type EnvironmentRow = {
  id: string;
  name: string;
};

export type VariableRow = {
  id: string;
  name: string;
  environmentId: string;
  environment?: {
    id: string;
    name: string;
  };
};

export type CommandRow = {
  id: string;
  name: string;
  shellCommand: string;
  cronExpression: string;
  enabled: boolean;
  timeoutMs: number;
  environmentId: string;
  environment?: {
    id: string;
    name: string;
  };
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
};

export type UpdateEnvironmentPayload = {
  id: string;
  name: string;
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
  cronExpression: string;
  enabled: boolean;
  timeoutMs: number;
  environmentId: string;
};

export type UpdateCommandPayload = {
  id: string;
  name?: string;
  shellCommand?: string;
  cronExpression?: string;
  enabled?: boolean;
  timeoutMs?: number;
};

export function useEnvironmentsQuery() {
  return useQuery({
    queryKey: ["scheduler", "environments"],
    queryFn: async () => {
      const result = await listEnvironments({
        fields: ["id", "name"],
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

export function useVariablesQuery() {
  return useQuery({
    queryKey: ["scheduler", "variables"],
    queryFn: async () => {
      const result = await listVariables({
        fields: ["id", "name", "environmentId", { environment: ["id", "name"] }],
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
        fields: [
          "id",
          "name",
          "shellCommand",
          "cronExpression",
          "enabled",
          "timeoutMs",
          "environmentId",
          { environment: ["id", "name"] },
        ],
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
        fields: ["id", "name"],
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
    mutationFn: async ({ id, name }: UpdateEnvironmentPayload) => {
      const result = await updateEnvironment({
        identity: id,
        input: { name },
        fields: ["id", "name"],
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
        fields: ["id", "name", "cronExpression", "enabled", "timeoutMs", "environmentId"],
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
        fields: ["id", "name", "cronExpression", "enabled", "timeoutMs", "environmentId"],
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
