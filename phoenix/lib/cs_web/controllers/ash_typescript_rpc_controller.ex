defmodule CsWeb.AshTypescriptRpcController do
  use CsWeb, :controller

  def run(conn, params) do
    result = AshTypescript.Rpc.run_action(:cs, conn, params)
    json(conn, result)
  end

  def validate(conn, params) do
    result = AshTypescript.Rpc.validate_action(:cs, conn, params)
    json(conn, result)
  end
end
