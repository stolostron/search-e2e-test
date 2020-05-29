# search-e2e-test

End-to-end tests for the Open Cluster Management search component.

## Running the tests

### Pre-requisites
1. nodeJS
2. OpenShift CLI


### Run the tests

#### From Repo

1. Copy the `options.yaml.template` file into `./options.yaml` and fill in the necessary values. 
    > **Alternative:** Set the values in options.yaml as environment variables like: `OPTIONS_HUB_DOMAINNAME`, `OPTIONS_HUB_USER`, `OPTIONS_HUB_PASSWORD`
2. Run `npm install`
3. Run `npm run test:e2e` OR `npm run test:e2e-headless`

#### From Dockerfile

1. Copy the `options.yaml.template` file into `./options.yaml` and fill in the necessary values.
2. Pull an existing image or build your own using `docker build -t <image_name>:<tag> .` 
3. Run the image with the following command `docker run -it --volume $(pwd)/test-output:/results --volume $(pwd)/options.yaml:/resources/options.yaml <image_name>:<tag>` 
 
## The tests consist of two user scenarios:

1. Cluster Admin user
2. Viewer user

Before the tests are run, we create an identity provider (provider can be found using: `oc describe oauth cluster`) and user for the viewer scenario. This allows us to test regressions in Role-Based Access Control.
