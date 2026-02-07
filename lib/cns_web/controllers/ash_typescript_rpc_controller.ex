defmodule CnsWeb.AshTypescriptRpcController do
  use CnsWeb, :controller

  def run(conn, params) do
    result = AshTypescript.Rpc.run_action(:cns, conn, params)
    json(conn, result)
  end

  def validate(conn, params) do
    result = AshTypescript.Rpc.validate_action(:cns, conn, params)
    json(conn, result)
  end
end
