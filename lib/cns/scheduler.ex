defmodule Cns.Scheduler do
  @moduledoc false

  use Ash.Domain, otp_app: :cns, extensions: [AshAdmin.Domain, AshTypescript.Rpc]

  admin do
    show? true
  end

  typescript_rpc do
    resource Cns.Scheduler.Environment do
      rpc_action :list_environments, :read
      rpc_action :create_environment, :create
      rpc_action :update_environment, :update
      rpc_action :destroy_environment, :destroy
    end

    resource Cns.Scheduler.Variable do
      rpc_action :list_variables, :read
      rpc_action :create_variable, :create
      rpc_action :update_variable, :update
      rpc_action :destroy_variable, :destroy
    end

    resource Cns.Scheduler.Command do
      rpc_action :list_commands, :read
      rpc_action :create_command, :create
      rpc_action :update_command, :update
      rpc_action :destroy_command, :destroy
      rpc_action :enqueue_command_run, :enqueue_run
      rpc_action :enqueue_command_run_in, :enqueue_run_in
      rpc_action :enqueue_command_run_force, :enqueue_run_force
      rpc_action :retry_command_last_failed, :retry_last_failed
    end

    resource Cns.Scheduler.CommandExecutionEvent do
      rpc_action :list_command_execution_events, :read
      rpc_action :list_events_for_command, :for_command
      rpc_action :retry_command_execution_event, :retry
    end
  end

  resources do
    resource Cns.Scheduler.Environment do
      define :create_environment, action: :create
      define :update_environment, action: :update
      define :destroy_environment, action: :destroy
      define :list_environments, action: :read
      define :get_environment, action: :read, get_by: [:id]
      define :get_environment_by_name, action: :by_name, args: [:name], get?: true
    end

    resource Cns.Scheduler.Variable do
      define :create_variable, action: :create
      define :update_variable, action: :update
      define :destroy_variable, action: :destroy
      define :list_variables, action: :read
      define :get_variable, action: :read, get_by: [:id]
    end

    resource Cns.Scheduler.Command do
      define :create_command, action: :create
      define :update_command, action: :update
      define :destroy_command, action: :destroy
      define :list_commands, action: :read
      define :list_enabled_commands, action: :enabled
      define :get_command, action: :read, get_by: [:id]
      define :enqueue_command_run, action: :enqueue_run, args: [:id]
      define :enqueue_command_run_in, action: :enqueue_run_in, args: [:id, :delay_seconds]
      define :enqueue_command_run_force, action: :enqueue_run_force, args: [:id]
      define :retry_command_last_failed, action: :retry_last_failed, args: [:id]
    end

    resource Cns.Scheduler.CommandExecutionEvent do
      define :create_command_execution_event, action: :create
      define :list_command_execution_events, action: :read
      define :get_command_execution_event, action: :read, get_by: [:id]
      define :list_events_for_command, action: :for_command, args: [:command_id]
      define :retry_command_execution_event, action: :retry, args: [:id]
    end
  end
end
