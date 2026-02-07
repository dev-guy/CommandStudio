import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock3,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCommandsQuery,
  useCreateCommandMutation,
  useCreateEnvironmentMutation,
  useCreateVariableMutation,
  useEnvironmentsQuery,
  useExecutionEventsQuery,
  useUpdateCommandMutation,
  useUpdateEnvironmentMutation,
  useUpdateVariableMutation,
  useVariablesQuery,
} from "@/features/scheduler/queries";

const formatDuration = (durationMs: number | null) => {
  if (!durationMs || durationMs <= 0) {
    return "-";
  }

  return `${Math.round(durationMs / 1000)}s`;
};

const formatTimestamp = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const statusVariant = (status: string) => {
  switch (status) {
    case "succeeded":
      return "success" as const;
    case "failed":
      return "danger" as const;
    case "started":
      return "warning" as const;
    default:
      return "default" as const;
  }
};

const queryError = (...messages: Array<string | undefined>) =>
  messages.find((message) => message && message.length > 0) || null;

export function SchedulerDashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  const [createEnvironmentName, setCreateEnvironmentName] = useState("");
  const [updateEnvironmentId, setUpdateEnvironmentId] = useState("");
  const [updateEnvironmentName, setUpdateEnvironmentName] = useState("");

  const [createVariableName, setCreateVariableName] = useState("");
  const [createVariableValue, setCreateVariableValue] = useState("");
  const [createVariableEnvironmentId, setCreateVariableEnvironmentId] = useState("");
  const [updateVariableId, setUpdateVariableId] = useState("");
  const [updateVariableName, setUpdateVariableName] = useState("");
  const [updateVariableValue, setUpdateVariableValue] = useState("");

  const [createCommandName, setCreateCommandName] = useState("");
  const [createCommandShell, setCreateCommandShell] = useState("");
  const [createCommandCron, setCreateCommandCron] = useState("* * * * *");
  const [createCommandEnvironmentId, setCreateCommandEnvironmentId] = useState("");
  const [createCommandTimeout, setCreateCommandTimeout] = useState("60000");
  const [createCommandEnabled, setCreateCommandEnabled] = useState(true);

  const [updateCommandId, setUpdateCommandId] = useState("");
  const [updateCommandName, setUpdateCommandName] = useState("");
  const [updateCommandShell, setUpdateCommandShell] = useState("");
  const [updateCommandCron, setUpdateCommandCron] = useState("* * * * *");
  const [updateCommandTimeout, setUpdateCommandTimeout] = useState("60000");
  const [updateCommandEnabled, setUpdateCommandEnabled] = useState(true);

  const environmentsQuery = useEnvironmentsQuery();
  const variablesQuery = useVariablesQuery();
  const commandsQuery = useCommandsQuery();
  const eventsQuery = useExecutionEventsQuery();

  const createEnvironmentMutation = useCreateEnvironmentMutation();
  const updateEnvironmentMutation = useUpdateEnvironmentMutation();
  const createVariableMutation = useCreateVariableMutation();
  const updateVariableMutation = useUpdateVariableMutation();
  const createCommandMutation = useCreateCommandMutation();
  const updateCommandMutation = useUpdateCommandMutation();

  const loading =
    environmentsQuery.isLoading ||
    variablesQuery.isLoading ||
    commandsQuery.isLoading ||
    eventsQuery.isLoading;

  const environments = environmentsQuery.data ?? [];
  const variables = variablesQuery.data ?? [];
  const commands = commandsQuery.data ?? [];
  const events = eventsQuery.data ?? [];

  useEffect(() => {
    if (!createVariableEnvironmentId && environments.length > 0) {
      setCreateVariableEnvironmentId(environments[0].id);
    }

    if (!createCommandEnvironmentId && environments.length > 0) {
      setCreateCommandEnvironmentId(environments[0].id);
    }

    if (!updateEnvironmentId && environments.length > 0) {
      setUpdateEnvironmentId(environments[0].id);
      setUpdateEnvironmentName(environments[0].name);
    }
  }, [
    createCommandEnvironmentId,
    createVariableEnvironmentId,
    environments,
    updateEnvironmentId,
  ]);

  useEffect(() => {
    if (!updateVariableId && variables.length > 0) {
      setUpdateVariableId(variables[0].id);
      setUpdateVariableName(variables[0].name);
      setUpdateVariableValue("");
    }
  }, [updateVariableId, variables]);

  useEffect(() => {
    if (!updateCommandId && commands.length > 0) {
      const firstCommand = commands[0];
      setUpdateCommandId(firstCommand.id);
      setUpdateCommandName(firstCommand.name);
      setUpdateCommandShell(firstCommand.shellCommand);
      setUpdateCommandCron(firstCommand.cronExpression);
      setUpdateCommandTimeout(String(firstCommand.timeoutMs));
      setUpdateCommandEnabled(firstCommand.enabled);
    }
  }, [commands, updateCommandId]);

  const selectedEnvironment = environments.find((environment) => environment.id === updateEnvironmentId);
  const selectedVariable = variables.find((variable) => variable.id === updateVariableId);
  const selectedCommand = commands.find((command) => command.id === updateCommandId);

  useEffect(() => {
    if (selectedEnvironment) {
      setUpdateEnvironmentName(selectedEnvironment.name);
    }
  }, [selectedEnvironment?.id]);

  useEffect(() => {
    if (selectedVariable) {
      setUpdateVariableName(selectedVariable.name);
      setUpdateVariableValue("");
    }
  }, [selectedVariable?.id]);

  useEffect(() => {
    if (selectedCommand) {
      setUpdateCommandName(selectedCommand.name);
      setUpdateCommandShell(selectedCommand.shellCommand);
      setUpdateCommandCron(selectedCommand.cronExpression);
      setUpdateCommandTimeout(String(selectedCommand.timeoutMs));
      setUpdateCommandEnabled(selectedCommand.enabled);
    }
  }, [selectedCommand?.id]);

  const errorMessage = queryError(
    environmentsQuery.error?.message,
    variablesQuery.error?.message,
    commandsQuery.error?.message,
    eventsQuery.error?.message,
    createEnvironmentMutation.error?.message,
    updateEnvironmentMutation.error?.message,
    createVariableMutation.error?.message,
    updateVariableMutation.error?.message,
    createCommandMutation.error?.message,
    updateCommandMutation.error?.message,
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredCommands = useMemo(() => {
    if (!normalizedSearch) {
      return commands;
    }

    return commands.filter((command) => {
      const environmentName = command.environment?.name ?? "";

      return `${command.name} ${command.cronExpression} ${environmentName}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [commands, normalizedSearch]);

  const filteredVariables = useMemo(() => {
    if (!normalizedSearch) {
      return variables;
    }

    return variables.filter((variable) => {
      const environmentName = variable.environment?.name ?? "";
      return `${variable.name} ${environmentName}`.toLowerCase().includes(normalizedSearch);
    });
  }, [variables, normalizedSearch]);

  const filteredEvents = useMemo(() => {
    if (!normalizedSearch) {
      return events;
    }

    return events.filter((event) => {
      const commandName = event.command?.name ?? "";
      return `${commandName} ${event.status} ${event.stdout} ${event.stderr}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [events, normalizedSearch]);

  const handleCreateEnvironment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!createEnvironmentName.trim()) {
      return;
    }

    await createEnvironmentMutation.mutateAsync({ name: createEnvironmentName.trim() });
    setCreateEnvironmentName("");
  };

  const handleUpdateEnvironment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!updateEnvironmentId || !updateEnvironmentName.trim()) {
      return;
    }

    await updateEnvironmentMutation.mutateAsync({
      id: updateEnvironmentId,
      name: updateEnvironmentName.trim(),
    });
  };

  const handleCreateVariable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!createVariableName.trim() || !createVariableValue || !createVariableEnvironmentId) {
      return;
    }

    await createVariableMutation.mutateAsync({
      name: createVariableName.trim().toUpperCase(),
      value: createVariableValue,
      environmentId: createVariableEnvironmentId,
    });

    setCreateVariableName("");
    setCreateVariableValue("");
  };

  const handleUpdateVariable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!updateVariableId || !updateVariableName.trim()) {
      return;
    }

    await updateVariableMutation.mutateAsync({
      id: updateVariableId,
      name: updateVariableName.trim().toUpperCase(),
      value: updateVariableValue || undefined,
    });

    setUpdateVariableValue("");
  };

  const handleCreateCommand = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !createCommandName.trim() ||
      !createCommandShell.trim() ||
      !createCommandCron.trim() ||
      !createCommandEnvironmentId
    ) {
      return;
    }

    await createCommandMutation.mutateAsync({
      name: createCommandName.trim(),
      shellCommand: createCommandShell.trim(),
      cronExpression: createCommandCron.trim(),
      environmentId: createCommandEnvironmentId,
      timeoutMs: Number(createCommandTimeout),
      enabled: createCommandEnabled,
    });

    setCreateCommandName("");
    setCreateCommandShell("");
    setCreateCommandCron("* * * * *");
    setCreateCommandTimeout("60000");
    setCreateCommandEnabled(true);
  };

  const handleUpdateCommand = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!updateCommandId || !updateCommandName.trim() || !updateCommandCron.trim()) {
      return;
    }

    await updateCommandMutation.mutateAsync({
      id: updateCommandId,
      name: updateCommandName.trim(),
      shellCommand: updateCommandShell.trim(),
      cronExpression: updateCommandCron.trim(),
      timeoutMs: Number(updateCommandTimeout),
      enabled: updateCommandEnabled,
    });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f7f2df_0%,#fcfcfb_55%,#eef5f3_100%)] pb-12 text-zinc-900">
      <div className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-[0_14px_40px_-24px_rgba(0,0,0,0.35)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
              <Activity className="h-3.5 w-3.5" />
              Command Scheduler
            </p>
            <h1 className="font-[Sora] text-3xl font-bold tracking-tight sm:text-4xl">
              Operations Control Panel
            </h1>
            <p className="mt-2 text-zinc-600">
              Live data and mutations powered by TanStack Query + AshTypescript RPC.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="group"
              onClick={() => {
                void Promise.all([
                  environmentsQuery.refetch(),
                  variablesQuery.refetch(),
                  commandsQuery.refetch(),
                  eventsQuery.refetch(),
                ]);
              }}
            >
              <RefreshCw className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
              Refresh data
            </Button>
            <Button>
              <Plus className="h-4 w-4" />
              Mutation-ready
            </Button>
          </div>
        </header>

        {errorMessage && (
          <Card className="mb-6 border-rose-200 bg-rose-50">
            <CardContent className="pt-6 text-sm text-rose-700">
              Request failed: {errorMessage}
            </CardContent>
          </Card>
        )}

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <Card className="hover:-translate-y-0.5 transition-transform duration-200">
            <CardHeader>
              <CardDescription>Scheduled commands</CardDescription>
              <CardTitle className="font-[Sora] text-3xl">{commands.length}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-zinc-600">Active + disabled command definitions.</CardContent>
          </Card>
          <Card className="hover:-translate-y-0.5 transition-transform duration-200">
            <CardHeader>
              <CardDescription>Environments</CardDescription>
              <CardTitle className="font-[Sora] text-3xl">{environments.length}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-zinc-600">Separate execution and secret scopes.</CardContent>
          </Card>
          <Card className="hover:-translate-y-0.5 transition-transform duration-200">
            <CardHeader>
              <CardDescription>Execution events shown</CardDescription>
              <CardTitle className="font-[Sora] text-3xl">{events.length}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-zinc-600">Latest events loaded through RPC queries.</CardContent>
          </Card>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Environment Mutations</CardTitle>
              <CardDescription>Create and rename environment records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form className="space-y-2" onSubmit={handleCreateEnvironment}>
                <Input
                  value={createEnvironmentName}
                  onChange={(event) => setCreateEnvironmentName(event.target.value)}
                  placeholder="new-environment"
                />
                <Button className="w-full" disabled={createEnvironmentMutation.isPending}>
                  {createEnvironmentMutation.isPending ? "Creating..." : "Create Environment"}
                </Button>
              </form>

              <form className="space-y-2" onSubmit={handleUpdateEnvironment}>
                <select
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  value={updateEnvironmentId}
                  onChange={(event) => setUpdateEnvironmentId(event.target.value)}
                >
                  {environments.map((environment) => (
                    <option key={environment.id} value={environment.id}>
                      {environment.name}
                    </option>
                  ))}
                </select>
                <Input
                  value={updateEnvironmentName}
                  onChange={(event) => setUpdateEnvironmentName(event.target.value)}
                  placeholder="updated name"
                />
                <Button variant="secondary" className="w-full" disabled={updateEnvironmentMutation.isPending}>
                  {updateEnvironmentMutation.isPending ? "Updating..." : "Update Environment"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Variable Mutations</CardTitle>
              <CardDescription>Create and rotate secret variables.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form className="space-y-2" onSubmit={handleCreateVariable}>
                <select
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  value={createVariableEnvironmentId}
                  onChange={(event) => setCreateVariableEnvironmentId(event.target.value)}
                >
                  {environments.map((environment) => (
                    <option key={environment.id} value={environment.id}>
                      {environment.name}
                    </option>
                  ))}
                </select>
                <Input
                  value={createVariableName}
                  onChange={(event) => setCreateVariableName(event.target.value)}
                  placeholder="VARIABLE_NAME"
                />
                <Input
                  value={createVariableValue}
                  onChange={(event) => setCreateVariableValue(event.target.value)}
                  placeholder="secret value"
                />
                <Button className="w-full" disabled={createVariableMutation.isPending}>
                  {createVariableMutation.isPending ? "Creating..." : "Create Variable"}
                </Button>
              </form>

              <form className="space-y-2" onSubmit={handleUpdateVariable}>
                <select
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  value={updateVariableId}
                  onChange={(event) => setUpdateVariableId(event.target.value)}
                >
                  {variables.map((variable) => (
                    <option key={variable.id} value={variable.id}>
                      {variable.name}
                    </option>
                  ))}
                </select>
                <Input
                  value={updateVariableName}
                  onChange={(event) => setUpdateVariableName(event.target.value)}
                  placeholder="VARIABLE_NAME"
                />
                <Input
                  value={updateVariableValue}
                  onChange={(event) => setUpdateVariableValue(event.target.value)}
                  placeholder="new secret value"
                />
                <Button variant="secondary" className="w-full" disabled={updateVariableMutation.isPending}>
                  {updateVariableMutation.isPending ? "Updating..." : "Update Variable"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Command Mutations</CardTitle>
              <CardDescription>Create and update schedules and execution config.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form className="space-y-2" onSubmit={handleCreateCommand}>
                <Input
                  value={createCommandName}
                  onChange={(event) => setCreateCommandName(event.target.value)}
                  placeholder="command-name"
                />
                <Input
                  value={createCommandShell}
                  onChange={(event) => setCreateCommandShell(event.target.value)}
                  placeholder="echo hello"
                />
                <Input
                  value={createCommandCron}
                  onChange={(event) => setCreateCommandCron(event.target.value)}
                  placeholder="* * * * *"
                />
                <select
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  value={createCommandEnvironmentId}
                  onChange={(event) => setCreateCommandEnvironmentId(event.target.value)}
                >
                  {environments.map((environment) => (
                    <option key={environment.id} value={environment.id}>
                      {environment.name}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  value={createCommandTimeout}
                  onChange={(event) => setCreateCommandTimeout(event.target.value)}
                  placeholder="timeout ms"
                />
                <label className="flex items-center gap-2 text-sm text-zinc-600">
                  <input
                    type="checkbox"
                    checked={createCommandEnabled}
                    onChange={(event) => setCreateCommandEnabled(event.target.checked)}
                  />
                  enabled
                </label>
                <Button className="w-full" disabled={createCommandMutation.isPending}>
                  {createCommandMutation.isPending ? "Creating..." : "Create Command"}
                </Button>
              </form>

              <form className="space-y-2" onSubmit={handleUpdateCommand}>
                <select
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  value={updateCommandId}
                  onChange={(event) => setUpdateCommandId(event.target.value)}
                >
                  {commands.map((command) => (
                    <option key={command.id} value={command.id}>
                      {command.name}
                    </option>
                  ))}
                </select>
                <Input
                  value={updateCommandName}
                  onChange={(event) => setUpdateCommandName(event.target.value)}
                  placeholder="command-name"
                />
                <Input
                  value={updateCommandShell}
                  onChange={(event) => setUpdateCommandShell(event.target.value)}
                  placeholder="shell command"
                />
                <Input
                  value={updateCommandCron}
                  onChange={(event) => setUpdateCommandCron(event.target.value)}
                  placeholder="cron expression"
                />
                <Input
                  type="number"
                  value={updateCommandTimeout}
                  onChange={(event) => setUpdateCommandTimeout(event.target.value)}
                  placeholder="timeout ms"
                />
                <label className="flex items-center gap-2 text-sm text-zinc-600">
                  <input
                    type="checkbox"
                    checked={updateCommandEnabled}
                    onChange={(event) => setUpdateCommandEnabled(event.target.checked)}
                  />
                  enabled
                </label>
                <Button variant="secondary" className="w-full" disabled={updateCommandMutation.isPending}>
                  {updateCommandMutation.isPending ? "Updating..." : "Update Command"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Environments
              </CardTitle>
              <CardDescription>Snapshot of environments and variable counts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {environments.map((environment) => {
                const variableCount = variables.filter(
                  (variable) => variable.environmentId === environment.id,
                ).length;

                return (
                  <div
                    key={environment.id}
                    className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 transition-all duration-200 hover:border-orange-300 hover:bg-orange-50/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-zinc-900">{environment.name}</p>
                      <Badge variant="default">{environment.id.slice(0, 8)}</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                      <span>{variableCount} variables</span>
                      <span>ID {environment.id.slice(0, 12)}</span>
                    </div>
                  </div>
                );
              })}
              {!loading && environments.length === 0 && (
                <p className="text-sm text-zinc-500">No environments found.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scheduler Workspace</CardTitle>
              <CardDescription>Search commands, variables, and execution history.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-5 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Search command name, variable, status, or environment"
                    className="pl-9"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <Button variant="secondary">Filter</Button>
              </div>

              <Tabs defaultValue="commands">
                <TabsList>
                  <TabsTrigger value="commands">Commands</TabsTrigger>
                  <TabsTrigger value="secrets">Secrets</TabsTrigger>
                  <TabsTrigger value="history">Execution History</TabsTrigger>
                </TabsList>

                <TabsContent value="commands">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Command</TableHead>
                        <TableHead>Cron</TableHead>
                        <TableHead>Environment</TableHead>
                        <TableHead>Timeout</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCommands.map((command) => (
                        <TableRow key={command.id}>
                          <TableCell className="font-medium">
                            <span className="inline-flex items-center gap-2">
                              <Terminal className="h-4 w-4 text-zinc-500" />
                              {command.name}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-zinc-700">
                            {command.cronExpression}
                          </TableCell>
                          <TableCell>{command.environment?.name ?? command.environmentId}</TableCell>
                          <TableCell>{Math.round(command.timeoutMs / 1000)}s</TableCell>
                          <TableCell>
                            <Badge variant={command.enabled ? "success" : "warning"}>
                              {command.enabled ? "enabled" : "disabled"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!loading && filteredCommands.length === 0 && (
                        <TableRow>
                          <TableCell className="text-zinc-500" colSpan={5}>
                            No commands matched your search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="secrets">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variable</TableHead>
                        <TableHead>Environment</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVariables.map((variable) => (
                        <TableRow key={variable.id}>
                          <TableCell className="font-medium">{variable.name}</TableCell>
                          <TableCell>{variable.environment?.name ?? variable.environmentId}</TableCell>
                          <TableCell className="text-zinc-500">Encrypted at rest</TableCell>
                        </TableRow>
                      ))}
                      {!loading && filteredVariables.length === 0 && (
                        <TableRow>
                          <TableCell className="text-zinc-500" colSpan={3}>
                            No variables matched your search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="history">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Command</TableHead>
                        <TableHead>Started at</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Output preview</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((executionEvent) => (
                        <TableRow key={executionEvent.id}>
                          <TableCell className="font-medium">
                            {executionEvent.command?.name ?? executionEvent.commandId}
                          </TableCell>
                          <TableCell>{formatTimestamp(executionEvent.startedAt)}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 text-zinc-600">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatDuration(executionEvent.durationMs)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(executionEvent.status)}>
                              {executionEvent.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[260px] truncate text-zinc-500">
                            {executionEvent.stdout || executionEvent.stderr || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!loading && filteredEvents.length === 0 && (
                        <TableRow>
                          <TableCell className="text-zinc-500" colSpan={5}>
                            No events matched your search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
