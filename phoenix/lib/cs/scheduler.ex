defmodule Cs.Scheduler do
  @moduledoc false

  use Ash.Domain, otp_app: :cs, extensions: [AshAdmin.Domain, AshTypescript.Rpc]

  alias Cs.Scheduler.Command
  alias Cs.Scheduler.CommandJob
  alias Cs.Scheduler.CommandJobEvent
  alias Cs.Scheduler.CommandSchedule
  alias Cs.Scheduler.CommandScheduleCron
  alias Cs.Scheduler.CommandScheduleEnvironment
  alias Cs.Scheduler.Cron
  alias Cs.Scheduler.Environment
  alias Cs.Scheduler.Variable
  alias Cs.Scheduler.VariableEnvironment

  admin do
    show? true
  end

  typescript_rpc do
    resource Environment do
      rpc_action :list_environments, :read
      rpc_action :create_environment, :create
      rpc_action :update_environment, :update
      rpc_action :destroy_environment, :destroy
    end

    resource Cron do
      rpc_action :list_crons, :read
      rpc_action :create_cron, :create
      rpc_action :update_cron, :update
      rpc_action :destroy_cron, :destroy
    end

    resource CommandSchedule do
      rpc_action :list_command_schedules, :read
      rpc_action :create_command_schedule, :create
      rpc_action :update_command_schedule, :update
      rpc_action :destroy_command_schedule, :destroy
    end

    resource CommandScheduleEnvironment do
      rpc_action :list_command_schedule_environments, :read
      rpc_action :create_command_schedule_environment, :create
      rpc_action :destroy_command_schedule_environment, :destroy
    end

    resource CommandScheduleCron do
      rpc_action :list_command_schedule_crons, :read
      rpc_action :create_command_schedule_cron, :create
      rpc_action :destroy_command_schedule_cron, :destroy
    end

    resource Variable do
      rpc_action :list_variables, :read
      rpc_action :create_variable, :create
      rpc_action :update_variable, :update
      rpc_action :destroy_variable, :destroy
    end

    resource VariableEnvironment do
      rpc_action :list_variable_environments, :read
      rpc_action :create_variable_environment, :create
      rpc_action :update_variable_environment, :update
      rpc_action :destroy_variable_environment, :destroy
    end

    resource Command do
      rpc_action :list_commands, :read
      rpc_action :create_command, :create
      rpc_action :update_command, :update
      rpc_action :destroy_command, :destroy
      rpc_action :enqueue_command_run, :enqueue_run
      rpc_action :enqueue_command_run_in, :enqueue_run_in
      rpc_action :enqueue_command_run_force, :enqueue_run_force
      rpc_action :retry_command_last_failed, :retry_last_failed
    end

    resource CommandJobEvent do
      rpc_action :list_command_job_events, :read
      rpc_action :list_events_for_command, :for_command
      rpc_action :retry_command_job_event, :retry
    end

    resource CommandJob do
      rpc_action :list_command_jobs, :read
      rpc_action :create_command_job, :create
      rpc_action :update_command_job, :update
      rpc_action :destroy_command_job, :destroy
    end
  end

  resources do
    resource Environment do
      define :create_environment, action: :create
      define :update_environment, action: :update
      define :destroy_environment, action: :destroy
      define :list_environments, action: :read
      define :list_enabled_environments, action: :enabled
      define :get_environment, action: :read, get_by: [:id]
      define :get_environment_by_name, action: :by_name, args: [:name], get?: true
    end

    resource Cron do
      define :create_cron, action: :create
      define :update_cron, action: :update
      define :destroy_cron, action: :destroy
      define :list_crons, action: :read
      define :get_cron, action: :read, get_by: [:id]
    end

    resource CommandSchedule do
      define :create_command_schedule, action: :create
      define :update_command_schedule, action: :update
      define :destroy_command_schedule, action: :destroy
      define :list_command_schedules, action: :read
      define :get_command_schedule, action: :read, get_by: [:id]
    end

    resource CommandScheduleEnvironment do
      define :create_command_schedule_environment, action: :create
      define :destroy_command_schedule_environment, action: :destroy
      define :list_command_schedule_environments, action: :read
      define :get_command_schedule_environment, action: :read, get_by: [:id]
    end

    resource CommandScheduleCron do
      define :create_command_schedule_cron, action: :create
      define :destroy_command_schedule_cron, action: :destroy
      define :list_command_schedule_crons, action: :read
      define :get_command_schedule_cron, action: :read, get_by: [:id]
    end

    resource Variable do
      define :create_variable, action: :create
      define :update_variable, action: :update
      define :destroy_variable, action: :destroy
      define :list_variables, action: :read
      define :get_variable, action: :read, get_by: [:id]
    end

    resource VariableEnvironment do
      define :create_variable_environment, action: :create
      define :update_variable_environment, action: :update
      define :destroy_variable_environment, action: :destroy
      define :list_variable_environments, action: :read
      define :get_variable_environment, action: :read, get_by: [:id]
    end

    resource Command do
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

    resource CommandJobEvent do
      define :create_command_job_event, action: :create
      define :list_command_job_events, action: :read
      define :get_command_job_event, action: :read, get_by: [:id]
      define :list_events_for_command, action: :for_command, args: [:command_id]
      define :retry_command_job_event, action: :retry, args: [:id]
    end

    resource CommandJob do
      define :create_command_job, action: :create
      define :update_command_job, action: :update
      define :destroy_command_job, action: :destroy
      define :list_command_jobs, action: :read
      define :get_command_job, action: :read, get_by: [:id]
      define :get_command_job_by_oban_job_id, action: :read, get_by: [:oban_job_id]
    end
  end
end
