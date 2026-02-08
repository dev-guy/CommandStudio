# Elixir Development Best Practices

This guide covers day-to-day quality checks for this project.

## AI

- Use Tidewave MCP to view backend console logs
- After changing dependencies update AGENTS.md by executing the following: 

```sh
mix usage_rules.sync AGENTS.md --all \
  --inline usage_rules:all \
  --link-to-folder deps
```

## PR Checklist

Run these before opening a PR:

```bash
mix deps.get
mix precommit
mix credo --strict
mix sobelow
mix dialyzer
```

Address the errors and warnings from the output of the above commands. Follow the additional instructions below. 

Then run:

```bash
mix precommit
```

## Credo

Use Credo to catch code smells and maintain consistency.

```bash
mix credo --strict
```

Best practices:
- Fix root causes instead of disabling checks unless there is a clear reason.
- Re-run after significant refactors.

## Tests

Use fast feedback loops while developing, then run the full suite.

```bash
# Run all tests
mix test

# Run one file
mix test test/path/to/some_test.exs

# Re-run only previously failed tests
mix test --failed
```

Best practices:
- Add or update tests for all behavior changes.
- Prefer focused file-level runs during development.
- Finish with full `mix test` or `mix precommit`.

## Sourceror

Use Sourceror for AST-aware code rewriting and safer codemods.

Common usage pattern:

```bash
mix run -e "IO.puts('Use Sourceror from scripts/tasks for AST-safe edits')"
```

Best practices:
- Prefer Sourceror for mechanical, repeated refactors.
- Keep transformations deterministic and idempotent.
- Validate generated changes with formatter + tests immediately after rewrites.

## Dialyxir (Dialyzer)

Use Dialyzer to find type/spec inconsistencies and unreachable patterns.

```bash
mix dialyzer
```

Best practices:
- Keep specs accurate and up to date.
- Treat new warnings as blockers unless explicitly triaged.

## Sobelow

Use Sobelow to scan Phoenix code for common security issues.

```bash
mix sobelow
```

Best practices:
- Treat high-confidence findings as blockers until triaged or fixed.
- Re-run after making security-related refactors.

## Styler

Use Styler enforces idiomatic Elixir style beyond default formatting. It is automatically run during `mix precommit`.
