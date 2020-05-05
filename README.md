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
2. Run `npm run test:e2e` OR `npm run test:e2e-headless`

The tests consist of two user scenarios:

1. Cluster Admin user
2. Viewer user

Before the tests are run, we create an identity provider (provider can be found using: `oc describe oauth cluster`) and user for the viewer scenario. This allows us to test regressions in Role-Based Access Control.
