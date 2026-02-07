defmodule Cns.Secrets do
  @moduledoc false

  use AshAuthentication.Secret

  def secret_for([:authentication, :tokens, :signing_secret], Cns.Accounts.User, _opts, _context) do
    Application.fetch_env(:cns, :token_signing_secret)
  end
end
