# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     Cs.Repo.insert!(%Cs.SomeSchema{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.

alias Cs.Accounts.User

admin_email = "admin@example.com"

random_password =
  24
  |> :crypto.strong_rand_bytes()
  |> Base.url_encode64(padding: false)
  |> binary_part(0, 15)

admin_exists? =
  User
  |> Ash.Query.for_read(:get_by_email, %{email: admin_email})
  |> Ash.read_one!(domain: Cs.Accounts, authorize?: false)
  |> Kernel.!=(nil)

if admin_exists? do
  IO.puts("Seed user already exists: #{admin_email}")
else
  user =
    User
    |> Ash.Changeset.for_create(:register_with_password, %{
      email: admin_email,
      password: random_password,
      password_confirmation: random_password
    })
    |> Ash.Changeset.force_change_attribute(:confirmed_at, DateTime.utc_now())
    |> Ash.create!(domain: Cs.Accounts, authorize?: false)

  IO.puts("Created seed user #{user.email}")
  IO.puts("Admin password: #{random_password}")
end
