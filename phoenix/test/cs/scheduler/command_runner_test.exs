defmodule Cs.Scheduler.CommandRunnerTest do
  use ExUnit.Case, async: true

  alias Cs.Scheduler.CommandRunner

  test "interpolate_command replaces known variables" do
    command = "echo $FOO-$BAR-$MISSING"
    variables = %{"FOO" => "alpha", "BAR" => "beta"}

    assert "echo alpha-beta-$MISSING" = CommandRunner.interpolate_command(command, variables)
  end

  test "interpolate_command matches variable names case-insensitively" do
    command = "echo $foo-$BAR-$bAz-$MISSING"
    variables = %{"FOO" => "alpha", "bar" => "beta", "Baz" => "gamma"}

    assert "echo alpha-beta-gamma-$MISSING" =
             CommandRunner.interpolate_command(command, variables)
  end

  test "run captures stdout and stderr separately for successful commands" do
    shell_command = "printf 'hello'; printf 'oops' 1>&2"

    assert {:ok, {"hello", "oops", 0}} = CommandRunner.run(shell_command, [], 5_000)
  end

  test "run returns error tuple for failing commands" do
    shell_command = "printf 'bad' 1>&2; exit 12"

    assert {:error, _reason, {"", "bad", 12}} = CommandRunner.run(shell_command, [], 5_000)
  end
end
