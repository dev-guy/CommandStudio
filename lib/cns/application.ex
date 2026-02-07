defmodule Cns.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      CnsWeb.Telemetry,
      Cns.Repo,
      Cns.Vault,
      {DNSCluster, query: Application.get_env(:cns, :dns_cluster_query) || :ignore},
      {Oban,
       AshOban.config(
         Application.fetch_env!(:cns, :ash_domains),
         Application.fetch_env!(:cns, Oban)
       )},
      {Phoenix.PubSub, name: Cns.PubSub},
      # Start a worker by calling: Cns.Worker.start_link(arg)
      # {Cns.Worker, arg},
      # Start to serve requests, typically the last entry
      CnsWeb.Endpoint,
      {AshAuthentication.Supervisor, [otp_app: :cns]}
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Cns.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    CnsWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
