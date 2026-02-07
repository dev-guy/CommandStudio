# Elixir Development Best Practices

This guide covers day-to-day quality checks for this project.

## Baseline workflow

Run these before opening a PR:

```bash
mix deps.get
mix precommit
mix credo --strict
mix sobelow
mix dialyzer
mix style
```

Notes:
- `mix precommit` is defined in this project and runs compile (warnings as errors), unlocks unused deps, formats code, and runs tests.
- `mix precommit` does **not** run Credo, Sobelow, Styler, or Dialyzer, so run those separately.

## Credo

Use Credo to catch code smells and maintain consistency.

```bash
mix credo --strict
```

Best practices:
- Run with `--strict` before every PR.
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
- Run before PRs that touch core business logic, concurrency, or boundaries.
- Keep specs accurate and up to date.
- Treat new warnings as blockers unless explicitly triaged.

## Sobelow

Use Sobelow to scan Phoenix code for common security issues.

```bash
mix sobelow
```

Best practices:
- Run before each PR, especially after auth, params, controller, or LiveView changes.
- Treat high-confidence findings as blockers until triaged or fixed.
- Re-run after making security-related refactors.

## Styler

Use Styler to enforce idiomatic Elixir style beyond default formatting.

```bash
mix style
```

Best practices:
- Run after major edits and before final review.
- Keep style changes in the same PR only when relevant; otherwise isolate large style-only rewrites.
- Use Styler together with `mix format` (already included in `mix precommit`).
