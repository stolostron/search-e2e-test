# search-e2e-test

End-to-end tests for the Open Cluster Management search component.

## Running the tests

### Pre-requisites
1. nodeJS
2. OpenShift CLI

### Setup environment
```bash
$ export CLUSTER_HOST=<ocp-hostname>
$ export CLUSTER_ADMIN_USER=kubeadmin
$ export CLUSTER_ADMIN_PWD=<kubeadmin-password>
```
Alternatively you can update `./config-defaults.json` with your environment info.

### Run the tests

1. Run `npm install`
2. Run `npm run test:install-selenium`
3. Run `npm test:e2e`

