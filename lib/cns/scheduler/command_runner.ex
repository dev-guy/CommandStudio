defmodule Cns.Scheduler.CommandRunner do
  @moduledoc false

  @type command_result ::
          {stdout :: String.t(), stderr :: String.t(), exit_status :: non_neg_integer()}

  @spec interpolate_command(String.t(), map()) :: String.t()
  def interpolate_command(shell_command, variables)
      when is_binary(shell_command) and is_map(variables) do
    Regex.replace(~r/\$([A-Z][A-Z0-9_]*)/, shell_command, fn _full, variable_name ->
      Map.get(variables, variable_name, "$#{variable_name}")
    end)
  end

  @spec run(String.t(), keyword(), non_neg_integer()) ::
          {:ok, command_result()} | {:error, String.t(), command_result()}
  def run(shell_command, env, timeout_ms) when is_binary(shell_command) and is_list(env) do
    stderr_file = stderr_file_path()
    escaped_stderr_file = shell_escape(stderr_file)
    wrapped_command = "{ #{shell_command}; } 2>#{escaped_stderr_file}"

    try do
      case run_with_timeout(wrapped_command, env, timeout_ms) do
        {:ok, {stdout, exit_status}} ->
          stderr = read_stderr(stderr_file)

          if exit_status == 0 do
            {:ok, {stdout, stderr, exit_status}}
          else
            {:error, "Command exited with status #{exit_status}", {stdout, stderr, exit_status}}
          end

        {:error, message, exit_status} ->
          stderr = read_stderr(stderr_file)
          {:error, message, {"", stderr, exit_status}}
      end
    rescue
      error in RuntimeError ->
        stderr = read_stderr(stderr_file)
        {:error, Exception.message(error), {"", stderr, 124}}
    after
      File.rm(stderr_file)
    end
  end

  defp read_stderr(path) do
    case File.read(path) do
      {:ok, stderr} -> stderr
      {:error, _reason} -> ""
    end
  end

  defp stderr_file_path do
    filename = "cns-command-runner-stderr-#{System.unique_integer([:positive, :monotonic])}.log"
    Path.join(System.tmp_dir!(), filename)
  end

  defp shell_escape(path) do
    "'#{String.replace(path, "'", "'\"'\"'")}'"
  end

  defp run_with_timeout(command, env, timeout_ms) do
    task = Task.async(fn -> System.cmd("sh", ["-c", command], env: env) end)

    case Task.yield(task, timeout_ms) || Task.shutdown(task, :brutal_kill) do
      {:ok, {stdout, exit_status}} ->
        {:ok, {stdout, exit_status}}

      nil ->
        {:error, "Command timed out after #{timeout_ms}ms", 124}
    end
  end
end
