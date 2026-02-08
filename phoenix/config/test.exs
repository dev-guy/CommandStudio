import Config

config :ash, policies: [show_policy_breakdowns?: true], disable_async?: true

config :bcrypt_elixir, log_rounds: 1

# In test we don't send emails
config :cs, Cs.Mailer, adapter: Swoosh.Adapters.Test

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
# Run `mix help test` for more information.
config :cs, Cs.Repo,
  username: System.get_env("PGUSER") || System.get_env("USER") || "postgres",
  password: System.get_env("PGPASSWORD") || "postgres",
  hostname: System.get_env("PGHOST") || "localhost",
  database: "cns_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2

config :cs, Cs.Vault,
  ciphers: [
    default: {
      Cloak.Ciphers.AES.GCM,
      tag: "AES.GCM.V1", key: Base.decode64!("MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=")
    }
  ]

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :cs, CsWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "QsiMsffZrhrgsvEf/iKY2ah4P3skvxyyYP9LFLzO1gqWAD9Kg0kPBC7KtrU7HgGj",
  server: false

config :cs, Oban, testing: :manual
config :cs, token_signing_secret: "QDlxH8AttusTgqdD0U/LhHkaSztX65yw"

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

# Sort query params output of verified routes for robust url comparisons
config :phoenix,
  sort_verified_routes_query_params: true

# Enable helpful, but potentially expensive runtime checks
config :phoenix_live_view,
  enable_expensive_runtime_checks: true

# Disable swoosh api client as it is only required for production adapters
config :swoosh, :api_client, false
