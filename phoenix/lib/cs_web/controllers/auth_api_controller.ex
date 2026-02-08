defmodule CsWeb.AuthApiController do
  use CsWeb, :controller

  import AshAuthentication.Plug.Helpers, only: [revoke_bearer_tokens: 2]

  alias Cs.Accounts.User

  def sign_in(conn, %{"email" => email, "password" => password}) do
    case AshAuthentication.Strategy.action(password_strategy(), :sign_in, %{
           email: email,
           password: password
         }) do
      {:ok, user} ->
        json(conn, %{
          success: true,
          data: %{
            token: Ash.Resource.get_metadata(user, :token),
            user: user_payload(user)
          }
        })

      {:error, _reason} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{success: false, error: "Invalid email or password"})
    end
  end

  def sign_in(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{success: false, error: "Expected email and password"})
  end

  def me(conn, _params) do
    case Ash.PlugHelpers.get_actor(conn) do
      %User{} = user ->
        json(conn, %{authenticated: true, user: user_payload(user)})

      _ ->
        conn
        |> put_status(:unauthorized)
        |> json(%{authenticated: false})
    end
  end

  def sign_out(conn, _params) do
    conn
    |> revoke_bearer_tokens(:cs)
    |> json(%{success: true})
  end

  defp password_strategy do
    User
    |> AshAuthentication.Info.authentication_strategies()
    |> Enum.find(&(&1.name == :password))
  end

  defp user_payload(user) do
    %{
      id: user.id,
      email: to_string(user.email)
    }
  end
end
