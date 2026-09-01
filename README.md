# search-e2e-test

End-to-end tests for the Open Cluster Management search component. The tests consist of the following user scenarios:

- [API tests](./tests/api/README.md)

## Running the tests locally

> Pre-requisites:
>
> - nodeJS
> - OpenShift CLI
> - yq command - [link](https://snapcraft.io/install/yq/fedora) for Fedora

1. Copy `resources/options.yaml` and update with your target cluster access info.
2. Run `npm install`
3. Run `npm run test`

## Running the tests using Docker image

1. Update `resources/options.yaml` with the necessary values or pass env vars.
2. Pull an existing image or build your own using `docker build -t <image_name>:<tag> .`
3. Run the image with the following command `docker run -it --volume $(pwd)/test-output:/results --volume $(pwd)/options.yaml:/resources/options.yaml <image_name>:<tag>`
   > **Alternative:** Pass the values in options.yaml as environment variables to the image like: `-e OPTIONS_HUB_BASEDOMAIN=${value}`

## NPM Commands

| Command                      | Description                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run test`               | Run Search API test flow through `start-tests.sh`                                             |
| `npm run test:api`           | Run Search API tests (jest)                                                                    |
| `npm run test:clean-reports` | Remove reports within the results directory                                                    |
| `npm run test:debug`         | Run Search API test flow with `NODE_ENV=debug`                                                |

## Export Variables

| Name                         | Optional/Required | Description                                                                                                                         |
| ---------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| ACM_VERSION                  | Optional          | ACM version that is being used for the test (**Default**: Version is determined by the deployed ACM version)                        |
| NODE_ENV                     | Optional          | Node enviroment that the E2E test is being executed in (**Default**: development **Options**: `debug`, `development`, `production`) |
| OPTIONS_HUB_BASEDOMAIN       | Required          | Base domain for the hub cluster                                                                                                     |
| OPTIONS_HUB_KUBECONFIG       | Optional          | Kubeconfig that will be used for the hub cluster (**Default**: /opt/.kube/config)                                                   |
| OPTIONS_HUB_KUBECONTEXT      | Optional          | Kube context that will be used for the hub cluster                                                                                  |
| OPTIONS_HUB_OC_IDP           | Optional          | Openshift user identify provider for the hub cluster (**Default**: kube:admin)                                                      |
| OPTIONS_HUB_PASSWORD         | Required          | Password for the hub cluster                                                                                                        |
| OPTIONS_HUB_USER             | Required          | User for the hub cluster                                                                                                            |
| OPTIONS_MANAGED_BASEDOMAIN   | Optional          | Base domain for the managed cluster                                                                                                 |
| OPTIONS_MANAGED_CLUSTER_NAME | Optional          | Name of the managed cluster                                                                                                         |
| OPTIONS_MANAGED_KUBECONFIG   | Optional          | Kubeconfig that will be used for the managed cluster (**Default**: /opt/.kube/import-config)                                        |
| OPTIONS_MANAGED_KUBECONTEXT  | Optional          | Kube context that will be used for the managed cluster.                                                                             |
| OPTIONS_MANAGED_PASSWORD     | Optional          | Password for the managed cluster                                                                                                    |
| OPTIONS_MANAGED_USER         | Optional          | User for the managed cluster                                                                                                        |
| SKIP_MANAGED_CLUSTER_TEST    | Optional          | Option to skip managed cluster E2E test                                                                                             |
| TEST_ENV                     | Optional          | Test environment to run the E2E test  (**Options**: `canary`, `rosa`)                                                               |
| TEST_MODE                    | Optional          | Test mode to run the E2E test  (**Options**: `BVT`, `smoke`)                                                                           |

## Links

These are a few useful links that will help provide technical reference and best practices when developing for the platform.

- [NPM Docs](https://docs.npmjs.com)

Image Rebuild: Wed Jul 27 11:14:38 EDT 2022
