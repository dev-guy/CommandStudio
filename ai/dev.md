- The backend uses Phoenix + Ash + Ash Oban
- Phoenix LiveView runs:
  - Ash Admin
  - Oban Web
- The main UI is a React app located in frontend/
  - Uses Tanstack Start (React) and shadcn/ui
  - Uses Tanstack Query to communicate with the Ash Typescript API
- Use Tidewave MCP to view backend console logs
- After changing dependencies update AGENTS.md by executing the following: 

```sh
mix usage_rules.sync AGENTS.md --all \
  --inline usage_rules:all \
  --link-to-folder deps
```

- Run the application by going to http://localhost:5173/
