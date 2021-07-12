# Search-UI Cypress Tests

The Cypress tests for search within [Console-UI](https://github.com/open-cluster-management/search)

---

## How to run Cypress tests

### Prerequisites

- Install NodeJS (v12) (npm will be installed with Node)
- From the root console-ui directory, run `npm install`

#### Live Cluster

1. Export the following environment variables:
    - OPTIONS_HUB_BASEDOMAIN (e.g. `<cluster>.dev07.open-cluster-management.com`)
    - OPTIONS_HUB_IDP (the desired identity provider group on OCP login page; defaults to `kube:admin` if not set)
    - OPTIONS_HUB_USER (`login username`; defaults to `kubeadmin` if not set)
    - OPTIONS_HUB_PASSWORD (`login password`)
2. From the root console-ui directory, run `npx cypress open`

#### Local Environment

1. Follow steps in [Console-UI](https://github.com/open-cluster-management/console-ui) to get the application running locally.
2. Follow the steps in [Console-API](https://github.com/open-cluster-management/console-api) to get the application running locally.
3. `oc login` to your hub cluster.
4. From the root console-ui directory, run `npx cypress open`
