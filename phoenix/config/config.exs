# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :ash,
  allow_forbidden_field_for_relationships_by_default?: true,
  include_embedded_source_by_default?: false,
  show_keysets_for_all_actions?: false,
  default_page_type: :keyset,
  policies: [no_filter_static_forbidden_reads?: false],
  keep_read_action_loads_when_loading?: false,
  default_actions_require_atomic?: true,
  read_action_after_action_hooks_in_order?: true,
  bulk_actions_default_to_errors?: true,
  transaction_rollback_on_error?: true,
  known_types: [AshPostgres.Timestamptz, AshPostgres.TimestamptzUsec]

config :ash_oban, pro?: false

config :ash_typescript,
  output_file: "assets/js/ash_rpc.ts",
  run_endpoint: "/api/rpc/run",
  validate_endpoint: "/api/rpc/validate",
  input_field_formatter: :camel_case,
  output_field_formatter: :camel_case,
  require_tenant_parameters: false,
  generate_zod_schemas: false,
  generate_phx_channel_rpc_actions: false,
  generate_validation_functions: true,
  zod_import_path: "zod",
  zod_schema_suffix: "ZodSchema",
  phoenix_import_path: "phoenix"

# Configure the mailer
#
# By default it uses the "Local" adapter which stores the emails
# locally. You can see the emails in your browser, at "/dev/mailbox".
#
# For production it's recommended to configure a different adapter
# at the `config/runtime.exs`.
config :cs, Cs.Mailer, adapter: Swoosh.Adapters.Local

# Configure the endpoint
config :cs, CsWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [html: CsWeb.ErrorHTML, json: CsWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Cs.PubSub,
  live_view: [signing_salt: "/PJv0dBe"]

config :cs, Oban,
  engine: Oban.Engines.Basic,
  notifier: Oban.Notifiers.Postgres,
  queues: [default: 10],
  repo: Cs.Repo,
  plugins: [
    {Oban.Plugins.Cron,
     crontab: [
       {"* * * * *", Cs.Scheduler.Workers.DispatchDueCommands}
     ]}
  ]

config :cs,
  ecto_repos: [Cs.Repo],
  generators: [timestamp_type: :utc_datetime],
  ash_domains: [Cs.Accounts, Cs.Scheduler]

# Configure esbuild (the version is required)
config :esbuild,
  version: "0.25.4",
  cs: [
    args:
      ~w(js/index.tsx js/app.js --bundle --target=es2022 --outdir=../priv/static/assets/js --external:/fonts/* --external:/images/* --alias:@=.),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => [Path.expand("../deps", __DIR__), Mix.Project.build_path()]}
  ]

config :ex_cldr, default_backend: Cs.Cldr

# Configure Elixir's Logger
config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

config :spark,
  formatter: [
    remove_parens?: true,
    "Ash.Resource": [
      section_order: [
        :admin,
        :authentication,
        :token,
        :user_identity,
        :postgres,
        :resource,
        :code_interface,
        :actions,
        :policies,
        :pub_sub,
        :preparations,
        :changes,
        :validations,
        :multitenancy,
        :attributes,
        :relationships,
        :calculations,
        :aggregates,
        :identities
      ]
    ],
    "Ash.Domain": [
      section_order: [:admin, :resources, :policies, :authorization, :domain, :execution]
    ]
  ]

# Configure tailwind (the version is required)
# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
config :tailwind,
  version: "4.1.12",
  cs: [
    args: ~w(
      --input=assets/css/app.css
      --output=priv/static/assets/css/app.css
    ),
    cd: Path.expand("..", __DIR__)
  ]

import_config "#{config_env()}.exs"
