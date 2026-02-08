defmodule CsWeb.Router do
  use CsWeb, :router
  use AshAuthentication.Phoenix.Router

  import AshAuthentication.Plug.Helpers
  import Oban.Web.Router

  alias Cs.Accounts.User
  alias Elixir.AshAuthentication.Phoenix.Overrides.DaisyUI

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {CsWeb.Layouts, :root}
    plug :protect_from_forgery

    plug :put_secure_browser_headers, %{
      "content-security-policy" =>
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ws: wss:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'"
    }

    plug :load_from_session
  end

  pipeline :api do
    plug :accepts, ["json"]
    plug :load_from_bearer
    plug :set_actor, :user
  end

  pipeline :authenticated_api do
    plug :require_authenticated_api_user
  end

  pipeline :allow_iframe_from_vite do
    plug :put_iframe_compatible_headers
  end

  scope "/", CsWeb do
    pipe_through :browser

    ash_authentication_live_session :authenticated_routes do
      # in each liveview, add one of the following at the top of the module:
      #
      # If an authenticated user must be present:
      # on_mount {CsWeb.LiveUserAuth, :live_user_required}
      #
      # If an authenticated user *may* be present:
      # on_mount {CsWeb.LiveUserAuth, :live_user_optional}
      #
      # If an authenticated user must *not* be present:
      # on_mount {CsWeb.LiveUserAuth, :live_no_user}
    end

    get "/ash-typescript", PageController, :index
  end

  scope "/api", CsWeb do
    pipe_through :api

    post "/auth/sign_in", AuthApiController, :sign_in
    get "/auth/me", AuthApiController, :me
    post "/auth/sign_out", AuthApiController, :sign_out
  end

  scope "/api", CsWeb do
    pipe_through [:api, :authenticated_api]

    post "/rpc/run", AshTypescriptRpcController, :run
    post "/rpc/validate", AshTypescriptRpcController, :validate
  end

  scope "/", CsWeb do
    pipe_through :browser

    get "/", PageController, :home
    auth_routes AuthController, User, path: "/auth"
    sign_out_route AuthController

    # Remove these if you'd like to use your own authentication views
    sign_in_route register_path: "/register",
                  reset_path: "/reset",
                  auth_routes_prefix: "/auth",
                  on_mount: [{CsWeb.LiveUserAuth, :live_no_user}],
                  overrides: [
                    CsWeb.AuthOverrides,
                    DaisyUI
                  ]

    # Remove this if you do not want to use the reset password feature
    reset_route auth_routes_prefix: "/auth",
                overrides: [
                  CsWeb.AuthOverrides,
                  DaisyUI
                ]

    # Remove this if you do not use the confirmation strategy
    confirm_route User, :confirm_new_user,
      auth_routes_prefix: "/auth",
      overrides: [CsWeb.AuthOverrides, DaisyUI]
  end

  # Other scopes may use custom stacks.
  # scope "/api", CsWeb do
  #   pipe_through :api
  # end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:cs, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: CsWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end

    scope "/" do
      pipe_through [:browser, :allow_iframe_from_vite]

      oban_dashboard("/oban")
    end
  end

  if Application.compile_env(:cs, :dev_routes) do
    import AshAdmin.Router

    scope "/admin" do
      pipe_through :browser

      ash_admin "/"
    end
  end

  defp put_iframe_compatible_headers(conn, _opts) do
    conn
    |> Plug.Conn.delete_resp_header("x-frame-options")
    |> Plug.Conn.put_resp_header(
      "content-security-policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ws: wss:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self' http://localhost:5173; form-action 'self'"
    )
  end

  defp require_authenticated_api_user(conn, _opts) do
    case Ash.PlugHelpers.get_actor(conn) do
      nil ->
        body = Jason.encode!(%{success: false, error: "Authentication required"})

        conn
        |> Plug.Conn.put_resp_content_type("application/json")
        |> Plug.Conn.send_resp(:unauthorized, body)
        |> Plug.Conn.halt()

      _actor ->
        conn
    end
  end
end
