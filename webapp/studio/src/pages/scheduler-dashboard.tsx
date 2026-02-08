import {
  type ComponentType,
  type FormEvent,
  type SVGProps,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  ArrowUpRight,
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
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useCommandSchedulesQuery,
  useCommandsQuery,
  useCreateCommandMutation,
  useCreateCommandScheduleMutation,
  useCreateCronMutation,
  useCreateEnvironmentMutation,
  useCreateVariableMutation,
  useCronsQuery,
  useEnvironmentsQuery,
  useExecutionEventsQuery,
  useUpdateCommandMutation,
  useUpdateCronMutation,
  useUpdateEnvironmentMutation,
  useUpdateVariableMutation,
  useVariablesQuery,
} from "@/features/scheduler/queries";

type DashboardSection =
  | "overview"
  | "commands"
  | "scheduling"
  | "variables"
  | "events"
  | "oban";

type SidebarItem = {
  id: DashboardSection;
  label: string;
  helper: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const sidebarItems: SidebarItem[] = [
  { id: "overview", label: "Overview", helper: "System health", icon: Activity },
  { id: "commands", label: "Commands", helper: "Execution setup", icon: Terminal },
  { id: "scheduling", label: "Scheduling", helper: "Crons + environments", icon: Clock3 },
  { id: "variables", label: "Variables", helper: "Secrets inventory", icon: ShieldCheck },
  { id: "events", label: "Events", helper: "Search and timeline", icon: Search },
  { id: "oban", label: "Oban Web", helper: "Worker operations", icon: Activity },
];

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

const unique = (values: string[]) => [...new Set(values)];

const normalize = (value: string) => value.trim().toLowerCase();

const toTimeoutMs = (value: string, fallback = 60_000) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

export function SchedulerDashboard() {
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");

  const [commandSearchTerm, setCommandSearchTerm] = useState("");
  const [variableSearchTerm, setVariableSearchTerm] = useState("");
  const [eventSearchTerm, setEventSearchTerm] = useState("");
  const [eventStatusFilter, setEventStatusFilter] = useState("all");
  const [eventPage, setEventPage] = useState(1);
  const [eventPageSize, setEventPageSize] = useState(10);

  const [createEnvironmentName, setCreateEnvironmentName] = useState("");
  const [createEnvironmentEnabled, setCreateEnvironmentEnabled] = useState(true);
  const [updateEnvironmentId, setUpdateEnvironmentId] = useState("");
  const [environmentEdits, setEnvironmentEdits] = useState<
    Record<string, { name: string; enabled: boolean }>
  >({});

  const [createCronName, setCreateCronName] = useState("");
  const [createCronExpression, setCreateCronExpression] = useState("* * * * *");
  const [createCronEnabled, setCreateCronEnabled] = useState(true);
  const [updateCronId, setUpdateCronId] = useState("");
  const [cronEdits, setCronEdits] = useState<
    Record<string, { name: string; crontabExpression: string; enabled: boolean }>
  >({});

  const [createVariableName, setCreateVariableName] = useState("");
  const [createVariableValue, setCreateVariableValue] = useState("");
  const [createVariableEnvironmentId, setCreateVariableEnvironmentId] = useState("");
  const [updateVariableId, setUpdateVariableId] = useState("");
  const [variableEdits, setVariableEdits] = useState<Record<string, { name: string; value: string }>>(
    {},
  );

  const [createCommandName, setCreateCommandName] = useState("");
  const [createCommandShell, setCreateCommandShell] = useState("");
  const [createCommandTimeout, setCreateCommandTimeout] = useState("60000");
  const [createCommandEnabled, setCreateCommandEnabled] = useState(true);

  const [updateCommandId, setUpdateCommandId] = useState("");
  const [commandEdits, setCommandEdits] = useState<
    Record<string, { name: string; shellCommand: string; timeoutMs: string; enabled: boolean }>
  >({});

  const [scheduleCommandId, setScheduleCommandId] = useState("");
  const [scheduleEdits, setScheduleEdits] = useState<
    Record<string, { environmentIds: string[]; cronIds: string[] }>
  >({});

  const environmentsQuery = useEnvironmentsQuery();
  const cronsQuery = useCronsQuery();
  const variablesQuery = useVariablesQuery();
  const commandsQuery = useCommandsQuery();
  const commandSchedulesQuery = useCommandSchedulesQuery();
  const eventsQuery = useExecutionEventsQuery(250);

  const createEnvironmentMutation = useCreateEnvironmentMutation();
  const updateEnvironmentMutation = useUpdateEnvironmentMutation();
  const createCronMutation = useCreateCronMutation();
  const updateCronMutation = useUpdateCronMutation();
  const createVariableMutation = useCreateVariableMutation();
  const updateVariableMutation = useUpdateVariableMutation();
  const createCommandMutation = useCreateCommandMutation();
  const updateCommandMutation = useUpdateCommandMutation();
  const createCommandScheduleMutation = useCreateCommandScheduleMutation();

  const loading =
    environmentsQuery.isLoading ||
    cronsQuery.isLoading ||
    variablesQuery.isLoading ||
    commandsQuery.isLoading ||
    commandSchedulesQuery.isLoading ||
    eventsQuery.isLoading;

  const environments = useMemo(() => environmentsQuery.data ?? [], [environmentsQuery.data]);
  const crons = useMemo(() => cronsQuery.data ?? [], [cronsQuery.data]);
  const variables = useMemo(() => variablesQuery.data ?? [], [variablesQuery.data]);
  const commands = useMemo(() => commandsQuery.data ?? [], [commandsQuery.data]);
  const commandSchedules = useMemo(
    () => commandSchedulesQuery.data ?? [],
    [commandSchedulesQuery.data],
  );
  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);

  const selectedCreateVariableEnvironmentId = createVariableEnvironmentId || environments[0]?.id || "";
  const selectedUpdateEnvironmentId = updateEnvironmentId || environments[0]?.id || "";
  const selectedUpdateCronId = updateCronId || crons[0]?.id || "";
  const selectedUpdateVariableId = updateVariableId || variables[0]?.id || "";
  const selectedUpdateCommandId = updateCommandId || commands[0]?.id || "";
  const selectedScheduleCommandId = scheduleCommandId || commands[0]?.id || "";

  const selectedEnvironment = environments.find(
    (environment) => environment.id === selectedUpdateEnvironmentId,
  );
  const selectedCron = crons.find((cron) => cron.id === selectedUpdateCronId);
  const selectedVariable = variables.find((variable) => variable.id === selectedUpdateVariableId);
  const selectedCommand = commands.find((command) => command.id === selectedUpdateCommandId);
  const selectedEnvironmentEdit = selectedEnvironment
    ? environmentEdits[selectedEnvironment.id]
    : undefined;
  const selectedCronEdit = selectedCron ? cronEdits[selectedCron.id] : undefined;
  const selectedVariableEdit = selectedVariable ? variableEdits[selectedVariable.id] : undefined;
  const selectedCommandEdit = selectedCommand ? commandEdits[selectedCommand.id] : undefined;

  const updateEnvironmentName = selectedEnvironmentEdit?.name ?? selectedEnvironment?.name ?? "";
  const updateEnvironmentEnabled =
    selectedEnvironmentEdit?.enabled ?? selectedEnvironment?.enabled ?? true;
  const updateCronName = selectedCronEdit?.name ?? selectedCron?.name ?? "";
  const updateCronExpression =
    selectedCronEdit?.crontabExpression ?? selectedCron?.crontabExpression ?? "* * * * *";
  const updateCronEnabled = selectedCronEdit?.enabled ?? selectedCron?.enabled ?? true;
  const updateVariableName = selectedVariableEdit?.name ?? selectedVariable?.name ?? "";
  const updateVariableValue = selectedVariableEdit?.value ?? "";
  const updateCommandName = selectedCommandEdit?.name ?? selectedCommand?.name ?? "";
  const updateCommandShell = selectedCommandEdit?.shellCommand ?? selectedCommand?.shellCommand ?? "";
  const updateCommandTimeout =
    selectedCommandEdit?.timeoutMs ?? String(selectedCommand?.timeoutMs ?? 60_000);
  const updateCommandEnabled = selectedCommandEdit?.enabled ?? selectedCommand?.enabled ?? true;

  const setEnvironmentEdit = (patch: Partial<{ name: string; enabled: boolean }>) => {
    if (!selectedEnvironment) {
      return;
    }

    setEnvironmentEdits((current) => {
      const base = current[selectedEnvironment.id] ?? {
        name: selectedEnvironment.name,
        enabled: selectedEnvironment.enabled,
      };

      return {
        ...current,
        [selectedEnvironment.id]: { ...base, ...patch },
      };
    });
  };

  const setCronEdit = (
    patch: Partial<{ name: string; crontabExpression: string; enabled: boolean }>,
  ) => {
    if (!selectedCron) {
      return;
    }

    setCronEdits((current) => {
      const base = current[selectedCron.id] ?? {
        name: selectedCron.name,
        crontabExpression: selectedCron.crontabExpression,
        enabled: selectedCron.enabled,
      };

      return {
        ...current,
        [selectedCron.id]: { ...base, ...patch },
      };
    });
  };

  const setVariableEdit = (patch: Partial<{ name: string; value: string }>) => {
    if (!selectedVariable) {
      return;
    }

    setVariableEdits((current) => {
      const base = current[selectedVariable.id] ?? {
        name: selectedVariable.name,
        value: "",
      };

      return {
        ...current,
        [selectedVariable.id]: { ...base, ...patch },
      };
    });
  };

  const setCommandEdit = (
    patch: Partial<{ name: string; shellCommand: string; timeoutMs: string; enabled: boolean }>,
  ) => {
    if (!selectedCommand) {
      return;
    }

    setCommandEdits((current) => {
      const base = current[selectedCommand.id] ?? {
        name: selectedCommand.name,
        shellCommand: selectedCommand.shellCommand,
        timeoutMs: String(selectedCommand.timeoutMs),
        enabled: selectedCommand.enabled,
      };

      return {
        ...current,
        [selectedCommand.id]: { ...base, ...patch },
      };
    });
  };

  const errorMessage = queryError(
    environmentsQuery.error?.message,
    cronsQuery.error?.message,
    variablesQuery.error?.message,
    commandsQuery.error?.message,
    commandSchedulesQuery.error?.message,
    eventsQuery.error?.message,
    createEnvironmentMutation.error?.message,
    updateEnvironmentMutation.error?.message,
    createCronMutation.error?.message,
    updateCronMutation.error?.message,
    createVariableMutation.error?.message,
    updateVariableMutation.error?.message,
    createCommandMutation.error?.message,
    updateCommandMutation.error?.message,
    createCommandScheduleMutation.error?.message,
  );

  const scheduleSummaryByCommandId = useMemo(() => {
    return commandSchedules.reduce<Record<string, { environments: string[]; crons: string[] }>>(
      (acc, schedule) => {
        const commandId = schedule.commandId;

        const scheduleEnvironmentNames = schedule.commandScheduleEnvironments
          .map((entry) => {
            if (!entry.environment) {
              return entry.environmentId;
            }

            return entry.environment.enabled
              ? entry.environment.name
              : `${entry.environment.name} (disabled)`;
          })
          .filter(Boolean);

        const scheduleCronLabels = schedule.commandScheduleCrons
          .map((entry) => entry.cron?.crontabExpression || entry.cronId)
          .filter(Boolean);

        const existing = acc[commandId] ?? { environments: [], crons: [] };

        acc[commandId] = {
          environments: unique(existing.environments.concat(scheduleEnvironmentNames)),
          crons: unique(existing.crons.concat(scheduleCronLabels)),
        };

        return acc;
      },
      {},
    );
  }, [commandSchedules]);

  const scheduleSelectionByCommandId = useMemo(() => {
    return commandSchedules.reduce<Record<string, { environmentIds: string[]; cronIds: string[] }>>(
      (acc, schedule) => {
        const commandId = schedule.commandId;
        const environmentIds = schedule.commandScheduleEnvironments.map((entry) => entry.environmentId);
        const cronIds = schedule.commandScheduleCrons.map((entry) => entry.cronId);
        const existing = acc[commandId] ?? { environmentIds: [], cronIds: [] };

        acc[commandId] = {
          environmentIds: unique(existing.environmentIds.concat(environmentIds)),
          cronIds: unique(existing.cronIds.concat(cronIds)),
        };

        return acc;
      },
      {},
    );
  }, [commandSchedules]);

  const selectedScheduleDefaults = useMemo(() => {
    if (!selectedScheduleCommandId) {
      return {
        environmentIds: [],
        cronIds: [],
      };
    }

    const selected = scheduleSelectionByCommandId[selectedScheduleCommandId] ?? {
      environmentIds: [],
      cronIds: [],
    };
    const knownEnvironmentIds = new Set(environments.map((environment) => environment.id));
    const knownCronIds = new Set(crons.map((cron) => cron.id));

    return {
      environmentIds: selected.environmentIds.filter((id) => knownEnvironmentIds.has(id)),
      cronIds: selected.cronIds.filter((id) => knownCronIds.has(id)),
    };
  }, [crons, environments, scheduleSelectionByCommandId, selectedScheduleCommandId]);

  const selectedScheduleEdit = selectedScheduleCommandId
    ? scheduleEdits[selectedScheduleCommandId]
    : undefined;
  const scheduleEnvironmentIds = selectedScheduleEdit?.environmentIds ?? selectedScheduleDefaults.environmentIds;
  const scheduleCronIds = selectedScheduleEdit?.cronIds ?? selectedScheduleDefaults.cronIds;

  const filteredCommands = useMemo(() => {
    const normalizedSearch = normalize(commandSearchTerm);

    if (!normalizedSearch) {
      return commands;
    }

    return commands.filter((command) => {
      const summary = scheduleSummaryByCommandId[command.id] ?? { environments: [], crons: [] };
      return `${command.name} ${command.shellCommand} ${summary.crons.join(" ")} ${summary.environments.join(" ")}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [commandSearchTerm, commands, scheduleSummaryByCommandId]);

  const filteredVariables = useMemo(() => {
    const normalizedSearch = normalize(variableSearchTerm);

    if (!normalizedSearch) {
      return variables;
    }

    return variables.filter((variable) => {
      const environmentName = variable.environment?.name ?? "";
      return `${variable.name} ${environmentName}`.toLowerCase().includes(normalizedSearch);
    });
  }, [variableSearchTerm, variables]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = normalize(eventSearchTerm);

    return events.filter((event) => {
      if (eventStatusFilter !== "all" && event.status !== eventStatusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const commandName = event.command?.name ?? "";
      return `${commandName} ${event.shellCommand} ${event.cronExpression} ${event.status} ${event.stdout} ${event.stderr}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [eventSearchTerm, eventStatusFilter, events]);

  const totalEventPages = Math.max(1, Math.ceil(filteredEvents.length / eventPageSize));
  const currentEventPage = Math.min(eventPage, totalEventPages);

  const paginatedEvents = useMemo(() => {
    const start = (currentEventPage - 1) * eventPageSize;
    return filteredEvents.slice(start, start + eventPageSize);
  }, [currentEventPage, eventPageSize, filteredEvents]);

  const eventRangeStart = filteredEvents.length === 0 ? 0 : (currentEventPage - 1) * eventPageSize + 1;
  const eventRangeEnd = Math.min(currentEventPage * eventPageSize, filteredEvents.length);

  const latestEvent = events[0];
  const commandsWithSchedules = Object.keys(scheduleSummaryByCommandId).length;

  const refreshAll = () => {
    void Promise.all([
      environmentsQuery.refetch(),
      cronsQuery.refetch(),
      variablesQuery.refetch(),
      commandsQuery.refetch(),
      commandSchedulesQuery.refetch(),
      eventsQuery.refetch(),
    ]);
  };

  const handleCreateEnvironment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!createEnvironmentName.trim()) {
      return;
    }

    await createEnvironmentMutation.mutateAsync({
      name: createEnvironmentName.trim(),
      enabled: createEnvironmentEnabled,
    });

    setCreateEnvironmentName("");
    setCreateEnvironmentEnabled(true);
  };

  const handleUpdateEnvironment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUpdateEnvironmentId || !updateEnvironmentName.trim()) {
      return;
    }

    await updateEnvironmentMutation.mutateAsync({
      id: selectedUpdateEnvironmentId,
      name: updateEnvironmentName.trim(),
      enabled: updateEnvironmentEnabled,
    });
  };

  const handleCreateCron = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!createCronName.trim() || !createCronExpression.trim()) {
      return;
    }

    await createCronMutation.mutateAsync({
      name: createCronName.trim(),
      crontabExpression: createCronExpression.trim(),
      enabled: createCronEnabled,
    });

    setCreateCronName("");
    setCreateCronExpression("* * * * *");
    setCreateCronEnabled(true);
  };

  const handleUpdateCron = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUpdateCronId || !updateCronName.trim() || !updateCronExpression.trim()) {
      return;
    }

    await updateCronMutation.mutateAsync({
      id: selectedUpdateCronId,
      name: updateCronName.trim(),
      crontabExpression: updateCronExpression.trim(),
      enabled: updateCronEnabled,
    });
  };

  const handleCreateVariable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!createVariableName.trim() || !createVariableValue || !selectedCreateVariableEnvironmentId) {
      return;
    }

    await createVariableMutation.mutateAsync({
      name: createVariableName.trim().toUpperCase(),
      value: createVariableValue,
      environmentId: selectedCreateVariableEnvironmentId,
    });

    setCreateVariableName("");
    setCreateVariableValue("");
  };

  const handleUpdateVariable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUpdateVariableId || !updateVariableName.trim()) {
      return;
    }

    await updateVariableMutation.mutateAsync({
      id: selectedUpdateVariableId,
      name: updateVariableName.trim().toUpperCase(),
      value: updateVariableValue || undefined,
    });

    setVariableEdit({ value: "" });
  };

  const handleCreateCommand = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!createCommandName.trim() || !createCommandShell.trim()) {
      return;
    }

    await createCommandMutation.mutateAsync({
      name: createCommandName.trim(),
      shellCommand: createCommandShell.trim(),
      timeoutMs: toTimeoutMs(createCommandTimeout),
      enabled: createCommandEnabled,
    });

    setCreateCommandName("");
    setCreateCommandShell("");
    setCreateCommandTimeout("60000");
    setCreateCommandEnabled(true);
  };

  const handleUpdateCommand = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUpdateCommandId || !updateCommandName.trim()) {
      return;
    }

    await updateCommandMutation.mutateAsync({
      id: selectedUpdateCommandId,
      name: updateCommandName.trim(),
      shellCommand: updateCommandShell.trim(),
      timeoutMs: toTimeoutMs(updateCommandTimeout),
      enabled: updateCommandEnabled,
    });
  };

  const handleCreateSchedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedScheduleCommandId) {
      return;
    }

    await createCommandScheduleMutation.mutateAsync({
      commandId: selectedScheduleCommandId,
      environmentIds: scheduleEnvironmentIds,
      cronIds: scheduleCronIds,
    });
  };

  const toggleSelection = (currentValues: string[], nextValue: string) => {
    if (currentValues.includes(nextValue)) {
      return currentValues.filter((value) => value !== nextValue);
    }

    return currentValues.concat(nextValue);
  };

  const setScheduleEdit = (
    patch: Partial<{ environmentIds: string[]; cronIds: string[] }>,
  ) => {
    if (!selectedScheduleCommandId) {
      return;
    }

    setScheduleEdits((current) => {
      const base = current[selectedScheduleCommandId] ?? selectedScheduleDefaults;

      return {
        ...current,
        [selectedScheduleCommandId]: { ...base, ...patch },
      };
    });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f5f8ec_0%,#fafaf9_50%,#eef4f8_100%)] pb-10 text-zinc-900">
      <div className="mx-auto w-full max-w-[1600px] px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-zinc-200/80 bg-white/85 p-4 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.4)] backdrop-blur lg:sticky lg:top-6">
            <div className="mb-5">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-lime-800">
                <Activity className="h-3.5 w-3.5" />
                Scheduler UX
              </p>
              <h1 className="font-[Sora] text-2xl font-bold tracking-tight">CommandStudio</h1>
              <p className="mt-2 text-sm text-zinc-600">Configure jobs, link schedules, and inspect execution telemetry.</p>
            </div>

            <nav className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1" aria-label="Scheduler workspace menu">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={[
                      "rounded-xl border px-3 py-3 text-left transition-all duration-200",
                      active
                        ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
                    ].join(" ")}
                  >
                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </div>
                    <p className={active ? "text-xs text-zinc-300" : "text-xs text-zinc-500"}>{item.helper}</p>
                  </button>
                );
              })}
            </nav>

            <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
              <p className="mb-1 font-semibold uppercase tracking-wide text-zinc-500">Current totals</p>
              <p>{commands.length} commands</p>
              <p>{commandSchedules.length} schedule links</p>
              <p>{events.length} recent events loaded</p>
            </div>
          </aside>

          <section className="space-y-6">
            <header className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white/90 p-5 shadow-[0_20px_40px_-34px_rgba(0,0,0,0.35)] backdrop-blur md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Operations Console</p>
                <h2 className="mt-1 font-[Sora] text-3xl font-semibold tracking-tight">Execution Configuration Workspace</h2>
                <p className="mt-2 text-sm text-zinc-600">A focused workflow for command setup, scheduling, and event diagnostics.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="group" onClick={refreshAll}>
                  <RefreshCw className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                  Refresh data
                </Button>
                <Button variant="secondary" onClick={() => setActiveSection("commands")}>
                  <Plus className="h-4 w-4" />
                  New command
                </Button>
              </div>
            </header>

            {errorMessage && (
              <Card className="border-rose-200 bg-rose-50">
                <CardContent className="pt-6 text-sm text-rose-700">Request failed: {errorMessage}</CardContent>
              </Card>
            )}

            {activeSection === "overview" && (
              <div className="space-y-6">
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Card>
                    <CardHeader>
                      <CardDescription>Commands</CardDescription>
                      <CardTitle className="font-[Sora] text-3xl">{commands.length}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-zinc-600">Executable command definitions.</CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardDescription>Schedule coverage</CardDescription>
                      <CardTitle className="font-[Sora] text-3xl">{commandsWithSchedules}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-zinc-600">Commands currently mapped to cron + environment links.</CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardDescription>Environments</CardDescription>
                      <CardTitle className="font-[Sora] text-3xl">{environments.length}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-zinc-600">Targets available for command execution.</CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardDescription>Recent events</CardDescription>
                      <CardTitle className="font-[Sora] text-3xl">{events.length}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-zinc-600">Loaded from latest execution history.</CardContent>
                  </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick command inventory</CardTitle>
                      <CardDescription>High-level command readiness and timeouts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Command</TableHead>
                            <TableHead>Shell</TableHead>
                            <TableHead>Timeout</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {commands.map((command) => (
                            <TableRow key={command.id}>
                              <TableCell className="font-medium">{command.name}</TableCell>
                              <TableCell className="max-w-[340px] truncate font-mono text-xs text-zinc-600">{command.shellCommand}</TableCell>
                              <TableCell>{formatDuration(command.timeoutMs)}</TableCell>
                              <TableCell>
                                <Badge variant={command.enabled ? "success" : "warning"}>
                                  {command.enabled ? "enabled" : "disabled"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          {!loading && commands.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-zinc-500">No commands configured.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Latest event pulse</CardTitle>
                      <CardDescription>Most recent execution signal from the event stream.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {latestEvent ? (
                        <>
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                            <div>
                              <p className="text-sm font-semibold text-zinc-900">{latestEvent.command?.name ?? latestEvent.commandId}</p>
                              <p className="text-xs text-zinc-500">{formatTimestamp(latestEvent.startedAt)}</p>
                            </div>
                            <Badge variant={statusVariant(latestEvent.status)}>{latestEvent.status}</Badge>
                          </div>
                          <div className="rounded-xl border border-zinc-200 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Output preview</p>
                            <p className="line-clamp-6 font-mono text-xs text-zinc-700">
                              {latestEvent.stdout || latestEvent.stderr || "No output captured."}
                            </p>
                          </div>
                          <Button variant="outline" className="w-full" onClick={() => setActiveSection("events")}>Inspect event timeline</Button>
                        </>
                      ) : (
                        <p className="text-sm text-zinc-500">No events have been recorded yet.</p>
                      )}
                    </CardContent>
                  </Card>
                </section>
              </div>
            )}

            {activeSection === "commands" && (
              <div className="space-y-6">
                <section className="grid gap-6 xl:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Create command</CardTitle>
                      <CardDescription>Define the shell command, timeout, and enabled state.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-3" onSubmit={handleCreateCommand}>
                        <Input
                          value={createCommandName}
                          onChange={(event) => setCreateCommandName(event.target.value)}
                          placeholder="nightly-report-sync"
                        />
                        <Textarea
                          value={createCommandShell}
                          onChange={(event) => setCreateCommandShell(event.target.value)}
                          placeholder="bundle exec rake jobs:sync"
                        />
                        <Input
                          type="number"
                          value={createCommandTimeout}
                          onChange={(event) => setCreateCommandTimeout(event.target.value)}
                          placeholder="timeout in milliseconds"
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
                          {createCommandMutation.isPending ? "Creating..." : "Create command"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Update command</CardTitle>
                      <CardDescription>Edit existing command details without leaving context.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-3" onSubmit={handleUpdateCommand}>
                        <Select
                          value={selectedUpdateCommandId}
                          onChange={(event) => setUpdateCommandId(event.target.value)}
                        >
                          {commands.map((command) => (
                            <option key={command.id} value={command.id}>
                              {command.name}
                            </option>
                          ))}
                        </Select>
                        <Input
                          value={updateCommandName}
                          onChange={(event) => setCommandEdit({ name: event.target.value })}
                          placeholder="command name"
                        />
                        <Textarea
                          value={updateCommandShell}
                          onChange={(event) => setCommandEdit({ shellCommand: event.target.value })}
                          placeholder="shell command"
                        />
                        <Input
                          type="number"
                          value={updateCommandTimeout}
                          onChange={(event) => setCommandEdit({ timeoutMs: event.target.value })}
                          placeholder="timeout in milliseconds"
                        />
                        <label className="flex items-center gap-2 text-sm text-zinc-600">
                          <input
                            type="checkbox"
                            checked={updateCommandEnabled}
                            onChange={(event) => setCommandEdit({ enabled: event.target.checked })}
                          />
                          enabled
                        </label>
                        <Button variant="secondary" className="w-full" disabled={updateCommandMutation.isPending}>
                          {updateCommandMutation.isPending ? "Updating..." : "Update command"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </section>

                <Card>
                  <CardHeader>
                    <CardTitle>Configured commands</CardTitle>
                    <CardDescription>Search by name, shell command, environment, or cron expression.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="relative w-full max-w-lg">
                        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                        <Input
                          value={commandSearchTerm}
                          onChange={(event) => setCommandSearchTerm(event.target.value)}
                          className="pl-9"
                          placeholder="Search commands"
                        />
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Command</TableHead>
                          <TableHead>Schedules</TableHead>
                          <TableHead>Environments</TableHead>
                          <TableHead>Timeout</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCommands.map((command) => {
                          const summary = scheduleSummaryByCommandId[command.id] ?? {
                            environments: [],
                            crons: [],
                          };

                          return (
                            <TableRow key={command.id}>
                              <TableCell className="font-medium">
                                <span className="inline-flex items-center gap-2">
                                  <Terminal className="h-4 w-4 text-zinc-500" />
                                  {command.name}
                                </span>
                              </TableCell>
                              <TableCell className="font-mono text-xs text-zinc-700">
                                {summary.crons.length > 0 ? summary.crons.join(" | ") : "No schedules"}
                              </TableCell>
                              <TableCell>
                                {summary.environments.length > 0 ? summary.environments.join(", ") : "-"}
                              </TableCell>
                              <TableCell>{Math.round(command.timeoutMs / 1000)}s</TableCell>
                              <TableCell>
                                <Badge variant={command.enabled ? "success" : "warning"}>
                                  {command.enabled ? "enabled" : "disabled"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {!loading && filteredCommands.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-zinc-500">No commands matched your search.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "scheduling" && (
              <div className="space-y-6">
                <section className="grid gap-6 xl:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Environments</CardTitle>
                      <CardDescription>Create and maintain execution targets.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5 md:grid-cols-2">
                      <form className="space-y-2" onSubmit={handleCreateEnvironment}>
                        <Input
                          value={createEnvironmentName}
                          onChange={(event) => setCreateEnvironmentName(event.target.value)}
                          placeholder="new-environment"
                        />
                        <label className="flex items-center gap-2 text-sm text-zinc-600">
                          <input
                            type="checkbox"
                            checked={createEnvironmentEnabled}
                            onChange={(event) => setCreateEnvironmentEnabled(event.target.checked)}
                          />
                          enabled
                        </label>
                        <Button className="w-full" disabled={createEnvironmentMutation.isPending}>
                          {createEnvironmentMutation.isPending ? "Creating..." : "Create environment"}
                        </Button>
                      </form>

                      <form className="space-y-2" onSubmit={handleUpdateEnvironment}>
                        <Select
                          value={selectedUpdateEnvironmentId}
                          onChange={(event) => setUpdateEnvironmentId(event.target.value)}
                        >
                          {environments.map((environment) => (
                            <option key={environment.id} value={environment.id}>
                              {environment.name}
                            </option>
                          ))}
                        </Select>
                        <Input
                          value={updateEnvironmentName}
                          onChange={(event) => setEnvironmentEdit({ name: event.target.value })}
                          placeholder="updated name"
                        />
                        <label className="flex items-center gap-2 text-sm text-zinc-600">
                          <input
                            type="checkbox"
                            checked={updateEnvironmentEnabled}
                            onChange={(event) => setEnvironmentEdit({ enabled: event.target.checked })}
                          />
                          enabled
                        </label>
                        <Button variant="secondary" className="w-full" disabled={updateEnvironmentMutation.isPending}>
                          {updateEnvironmentMutation.isPending ? "Updating..." : "Update environment"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Cron definitions</CardTitle>
                      <CardDescription>Reusable run schedules shared across commands.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5 md:grid-cols-2">
                      <form className="space-y-2" onSubmit={handleCreateCron}>
                        <Input
                          value={createCronName}
                          onChange={(event) => setCreateCronName(event.target.value)}
                          placeholder="daily-report"
                        />
                        <Input
                          value={createCronExpression}
                          onChange={(event) => setCreateCronExpression(event.target.value)}
                          placeholder="* * * * *"
                        />
                        <label className="flex items-center gap-2 text-sm text-zinc-600">
                          <input
                            type="checkbox"
                            checked={createCronEnabled}
                            onChange={(event) => setCreateCronEnabled(event.target.checked)}
                          />
                          enabled
                        </label>
                        <Button className="w-full" disabled={createCronMutation.isPending}>
                          {createCronMutation.isPending ? "Creating..." : "Create cron"}
                        </Button>
                      </form>

                      <form className="space-y-2" onSubmit={handleUpdateCron}>
                        <Select value={selectedUpdateCronId} onChange={(event) => setUpdateCronId(event.target.value)}>
                          {crons.map((cron) => (
                            <option key={cron.id} value={cron.id}>
                              {cron.name}
                            </option>
                          ))}
                        </Select>
                        <Input
                          value={updateCronName}
                          onChange={(event) => setCronEdit({ name: event.target.value })}
                          placeholder="cron name"
                        />
                        <Input
                          value={updateCronExpression}
                          onChange={(event) => setCronEdit({ crontabExpression: event.target.value })}
                          placeholder="* * * * *"
                        />
                        <label className="flex items-center gap-2 text-sm text-zinc-600">
                          <input
                            type="checkbox"
                            checked={updateCronEnabled}
                            onChange={(event) => setCronEdit({ enabled: event.target.checked })}
                          />
                          enabled
                        </label>
                        <Button variant="secondary" className="w-full" disabled={updateCronMutation.isPending}>
                          {updateCronMutation.isPending ? "Updating..." : "Update cron"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </section>

                <Card>
                  <CardHeader>
                    <CardTitle>Command schedule mapping</CardTitle>
                    <CardDescription>Link one command to any combination of environments and cron entries.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4" onSubmit={handleCreateSchedule}>
                      <Select
                        value={selectedScheduleCommandId}
                        onChange={(event) => setScheduleCommandId(event.target.value)}
                      >
                        {commands.map((command) => (
                          <option key={command.id} value={command.id}>
                            {command.name}
                          </option>
                        ))}
                      </Select>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Environments</p>
                          <div className="space-y-1">
                            {environments.map((environment) => (
                              <label key={environment.id} className="flex items-center gap-2 text-sm text-zinc-700">
                                <input
                                  type="checkbox"
                                  checked={scheduleEnvironmentIds.includes(environment.id)}
                                  onChange={() =>
                                    setScheduleEdit({
                                      environmentIds: toggleSelection(
                                        scheduleEnvironmentIds,
                                        environment.id,
                                      ),
                                    })
                                  }
                                />
                                {environment.name}
                                {!environment.enabled ? <span className="text-zinc-400">(disabled)</span> : null}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Crons</p>
                          <div className="space-y-1">
                            {crons.map((cron) => (
                              <label key={cron.id} className="flex items-center gap-2 text-sm text-zinc-700">
                                <input
                                  type="checkbox"
                                  checked={scheduleCronIds.includes(cron.id)}
                                  onChange={() =>
                                    setScheduleEdit({
                                      cronIds: toggleSelection(scheduleCronIds, cron.id),
                                    })
                                  }
                                />
                                {cron.name}
                                <span className="font-mono text-xs text-zinc-500">{cron.crontabExpression}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button className="w-full md:w-auto" disabled={createCommandScheduleMutation.isPending}>
                        {createCommandScheduleMutation.isPending ? "Saving..." : "Update schedule links"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "variables" && (
              <div className="space-y-6">
                <section className="grid gap-6 xl:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Create variable</CardTitle>
                      <CardDescription>Add a secret variable scoped to one environment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-3" onSubmit={handleCreateVariable}>
                        <Select
                          value={selectedCreateVariableEnvironmentId}
                          onChange={(event) => setCreateVariableEnvironmentId(event.target.value)}
                        >
                          {environments.map((environment) => (
                            <option key={environment.id} value={environment.id}>
                              {environment.name}
                            </option>
                          ))}
                        </Select>
                        <Input
                          value={createVariableName}
                          onChange={(event) => setCreateVariableName(event.target.value)}
                          placeholder="VARIABLE_NAME"
                        />
                        <Textarea
                          value={createVariableValue}
                          onChange={(event) => setCreateVariableValue(event.target.value)}
                          placeholder="secret value"
                        />
                        <Button className="w-full" disabled={createVariableMutation.isPending}>
                          {createVariableMutation.isPending ? "Creating..." : "Create variable"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Rotate variable</CardTitle>
                      <CardDescription>Rename and rotate secret values in place.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-3" onSubmit={handleUpdateVariable}>
                        <Select
                          value={selectedUpdateVariableId}
                          onChange={(event) => setUpdateVariableId(event.target.value)}
                        >
                          {variables.map((variable) => (
                            <option key={variable.id} value={variable.id}>
                              {variable.name}
                            </option>
                          ))}
                        </Select>
                        <Input
                          value={updateVariableName}
                          onChange={(event) => setVariableEdit({ name: event.target.value })}
                          placeholder="VARIABLE_NAME"
                        />
                        <Textarea
                          value={updateVariableValue}
                          onChange={(event) => setVariableEdit({ value: event.target.value })}
                          placeholder="new secret value"
                        />
                        <Button variant="secondary" className="w-full" disabled={updateVariableMutation.isPending}>
                          {updateVariableMutation.isPending ? "Updating..." : "Update variable"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </section>

                <Card>
                  <CardHeader>
                    <CardTitle>Variable inventory</CardTitle>
                    <CardDescription>Search variable keys by name and environment.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="relative w-full max-w-lg">
                        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                        <Input
                          value={variableSearchTerm}
                          onChange={(event) => setVariableSearchTerm(event.target.value)}
                          className="pl-9"
                          placeholder="Search variable names"
                        />
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Variable</TableHead>
                          <TableHead>Environment</TableHead>
                          <TableHead>State</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVariables.map((variable) => (
                          <TableRow key={variable.id}>
                            <TableCell className="font-medium">{variable.name}</TableCell>
                            <TableCell>{variable.environment?.name ?? variable.environmentId}</TableCell>
                            <TableCell>
                              <Badge variant="default">Encrypted at rest</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!loading && filteredVariables.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-zinc-500">No variables matched your search.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "events" && (
              <Card>
                <CardHeader>
                  <CardTitle>Execution events</CardTitle>
                  <CardDescription>Searchable, filterable, and paginated event history.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_120px]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                      <Input
                        placeholder="Search command, shell command, status, stdout, or stderr"
                        value={eventSearchTerm}
                        onChange={(event) => {
                          setEventSearchTerm(event.target.value);
                          setEventPage(1);
                        }}
                        className="pl-9"
                      />
                    </div>

                    <Select
                      value={eventStatusFilter}
                      onChange={(event) => {
                        setEventStatusFilter(event.target.value);
                        setEventPage(1);
                      }}
                    >
                      <option value="all">All statuses</option>
                      <option value="succeeded">Succeeded</option>
                      <option value="failed">Failed</option>
                      <option value="started">Started</option>
                    </Select>

                    <Select
                      value={String(eventPageSize)}
                      onChange={(event) => {
                        setEventPageSize(Number(event.target.value));
                        setEventPage(1);
                      }}
                    >
                      <option value="10">10 / page</option>
                      <option value="25">25 / page</option>
                      <option value="50">50 / page</option>
                    </Select>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Command</TableHead>
                        <TableHead>Shell command</TableHead>
                        <TableHead>Cron expression</TableHead>
                        <TableHead>Started at</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Output preview</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedEvents.map((executionEvent) => (
                        <TableRow key={executionEvent.id}>
                          <TableCell className="font-medium">{executionEvent.command?.name ?? executionEvent.commandId}</TableCell>
                          <TableCell className="max-w-[320px] truncate font-mono text-xs text-zinc-700">{executionEvent.shellCommand || "-"}</TableCell>
                          <TableCell className="max-w-[220px] truncate font-mono text-xs text-zinc-600">{executionEvent.cronExpression || "-"}</TableCell>
                          <TableCell>{formatTimestamp(executionEvent.startedAt)}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 text-zinc-600">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatDuration(executionEvent.durationMs)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(executionEvent.status)}>{executionEvent.status}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[260px] truncate text-zinc-500">
                            {executionEvent.stdout || executionEvent.stderr || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!loading && paginatedEvents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-zinc-500">No events matched your filters.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  <div className="mt-4 flex flex-col gap-3 border-t border-zinc-200 pt-4 text-sm text-zinc-600 md:flex-row md:items-center md:justify-between">
                    <p>
                      Showing {eventRangeStart}-{eventRangeEnd} of {filteredEvents.length} matching events
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEventPage(1)}
                        disabled={currentEventPage <= 1}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEventPage((current) => Math.max(1, current - 1))}
                        disabled={currentEventPage <= 1}
                      >
                        Previous
                      </Button>
                      <span className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Page {currentEventPage} / {totalEventPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEventPage((current) => Math.min(totalEventPages, current + 1))}
                        disabled={currentEventPage >= totalEventPages}
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEventPage(totalEventPages)}
                        disabled={currentEventPage >= totalEventPages}
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "oban" && (
              <Card>
                <CardHeader>
                  <CardTitle>Oban Web</CardTitle>
                  <CardDescription>
                    Embedded worker dashboard from <span className="font-mono">http://localhost:4000/oban</span>.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-zinc-600">
                      Use this panel for queue diagnostics, job retries, and runtime throughput checks.
                    </p>
                    <a
                      href="http://localhost:4000/oban"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex"
                    >
                      <Button type="button" variant="outline" size="sm">
                        Open in new tab
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                    <iframe
                      title="Oban Web Dashboard"
                      src="http://localhost:4000/oban"
                      className="h-[72vh] w-full bg-white"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {!loading && commands.length === 0 && environments.length === 0 && crons.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                  <Badge variant="warning">No scheduler data yet</Badge>
                  <p className="max-w-xl text-sm text-zinc-600">Start by creating environments and commands, then map them to cron expressions and track execution events from the Events menu.</p>
                  <Button onClick={() => setActiveSection("commands")}>
                    <Plus className="h-4 w-4" />
                    Create first command
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
