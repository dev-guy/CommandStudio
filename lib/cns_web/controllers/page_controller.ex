defmodule CnsWeb.PageController do
  use CnsWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end

  def index conn, _params do
    render(conn, :index)
  end
end
