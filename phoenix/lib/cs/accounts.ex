defmodule Cs.Accounts do
  @moduledoc false
  use Ash.Domain, otp_app: :cs, extensions: [AshAdmin.Domain]

  admin do
    show? true
  end

  resources do
    resource Cs.Accounts.Token
    resource Cs.Accounts.User
  end
end
