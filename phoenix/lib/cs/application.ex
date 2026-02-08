defmodule Cs.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      CsWeb.Telemetry,
      Cs.Repo,
      Cs.Vault,
      {DNSCluster, query: Application.get_env(:cs, :dns_cluster_query) || :ignore},
      {Oban,
       AshOban.config(
         Application.fetch_env!(:cs, :ash_domains),
         Application.fetch_env!(:cs, Oban)
       )},
      {Phoenix.PubSub, name: Cs.PubSub},
      # Start a worker by calling: Cs.Worker.start_link(arg)
      # {Cs.Worker, arg},
      # Start to serve requests, typically the last entry
      CsWeb.Endpoint,
      {AshAuthentication.Supervisor, [otp_app: :cs]}
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Cs.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    CsWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
