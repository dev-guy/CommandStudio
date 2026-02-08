defmodule Cs.Secrets do
  @moduledoc false

  use AshAuthentication.Secret

  def secret_for([:authentication, :tokens, :signing_secret], Cs.Accounts.User, _opts, _context) do
    Application.fetch_env(:cs, :token_signing_secret)
  end
end
