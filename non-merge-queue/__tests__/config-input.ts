export const ConfigMockInput = {
  application: {
    name: 'my-first',
    enable: true,
    workflows: {
      provider: 'github_actions',
      excluded_workflows: ['release']
    },
    namespaces: [
      {
        type: 'prod',
        build: {
          build_workflow: 'prod_workflow'
        },
        delivery: {
          target: 'prod',
          base_replica: 3,
          rollout_strategy: 'rolling_upgrade'
        },
        appsignal: {
          enable: true,
          environment: 'appsignal',
          default_namespace: 'prod'
        },
        honeycomb: {
          enable: true,
          dataset: 'honeycomb'
        },
        cloudsql: {
          enable: true,
          project_id: 'google cloud'
        }
      },
      {
        type: 'staging',
        build: {
          build_workflow: 'staging_workflow'
        },
        delivery: {
          target: 'staging',
          base_replica: 4,
          rollout_strategy: 'blue_green'
        },
        appsignal: {
          enable: true,
          environment: 'appsignal',
          default_namespace: 'staging'
        },
        honeycomb: {
          enable: true,
          dataset: 'honey'
        },
        cloudsql: {
          enable: true,
          project_id: 'google'
        }
      }
    ],
    addons: {}
  }
}
