defmodule Cs.Scheduler.Environment do
  @moduledoc false

  use Ash.Resource,
    otp_app: :cs,
    domain: Cs.Scheduler,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshTypescript.Resource]

  postgres do
    table "environments"
    repo Cs.Repo
  end

  typescript do
    type_name "Environment"
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true
      accept [:name, :enabled]
    end

    update :update do
      primary? true
      accept [:name, :enabled]
    end

    read :by_name do
      argument :name, :string, allow_nil?: false
      get? true
      filter expr(name == ^arg(:name))
    end

    read :enabled do
      filter expr(enabled == true)
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :name, :string do
      allow_nil? false
      public? true
    end

    attribute :enabled, :boolean do
      allow_nil? false
      default true
      public? true
    end

    create_timestamp :created_at
    update_timestamp :updated_at
  end

  relationships do
    has_many :variables, Cs.Scheduler.Variable do
      destination_attribute :environment_id
      public? true
    end

    many_to_many :command_schedules, Cs.Scheduler.CommandSchedule do
      through Cs.Scheduler.CommandScheduleEnvironment
      source_attribute_on_join_resource :environment_id
      destination_attribute_on_join_resource :command_schedule_id
      public? true
    end

    has_many :command_schedule_environments, Cs.Scheduler.CommandScheduleEnvironment do
      destination_attribute :environment_id
      public? true
    end

    has_many :command_jobs, Cs.Scheduler.CommandJob do
      destination_attribute :environment_id
      public? true
    end
  end

  identities do
    identity :unique_name, [:name]
  end
end
