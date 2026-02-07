defmodule Cns.Accounts do
  use Ash.Domain, otp_app: :cns, extensions: [AshAdmin.Domain]

  admin do
    show? true
  end

  resources do
    resource Cns.Accounts.Token
    resource Cns.Accounts.User
  end
end
