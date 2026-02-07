1. Add codex CLI
2. Install devtools MCP
3. Install tidewave MCP
4. `mix.exs`
 - Add dialyxir, sobelow, credo, style

```
def project do
    [
      ...
      dialyzer: [
        plt_add_apps: [:mix, :ex_unit],
        flags: [:error_handling, :race_conditions, :underspecs],
        list_unused_filters: true
      ]
    ]
```
5. add Styler as a plugin to your .formatter.exs file

```
[
  plugins: [Styler]
]
```
