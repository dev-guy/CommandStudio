%{
  configs: [
    %{
      name: "default",
      files: %{
        included: ["lib/", "test/", "config/", "mix.exs"],
        excluded: ["_build/", "deps/", "node_modules/"]
      },
      strict: true,
      color: true,
      checks: [
        {Credo.Check.Design.TagTODO, exit_status: 2},
        {Credo.Check.Design.TagFIXME, exit_status: 2},
        {Credo.Check.Readability.MaxLineLength, priority: :low, max_length: 120},
        {Credo.Check.Refactor.CyclomaticComplexity, max_complexity: 12},
        {Credo.Check.Refactor.Nesting, max_nesting: 3}
      ]
    }
  ]
}
