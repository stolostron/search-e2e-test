#!/bin/bash

# Copyright (c) 2020 Red Hat, Inc.

echo "Initiating tests..."

if [ -z "$CYPRESS_TEST_MODE" ]; then
  echo "CYPRESS_TEST_MODE not exported; setting to 'e2e' mode"
  export CYPRESS_TEST_MODE='e2e'
fi

if [ -z "$BROWSER" ]; then
  echo "BROWSER not exported; setting to 'chrome (options available: 'chrome', 'firefox')'"
  export BROWSER="chrome"
fi

if [ ! -z "$RESOURCE_ID" ] && [ -z "$CYPRESS_RESOURCE_ID" ]; then
  echo "Slack integration is configured; processing..."
  export CYPRESS_RESOURCE_ID="$RESOURCE_ID"
  echo "Using Resource ID: $CYPRESS_RESOURCE_ID"
fi

if [ -z "$TEST_GROUP" ]; then
  echo "TEST_GROUP not exported; setting to 'all' (options available: 'all', 'import', 'aws', 'google', 'azure', 'validate', 'destroy')"
  export TEST_GROUP="all"
fi

# setup kind cluster for functional tests
if [[ $CYPRESS_TEST_MODE == 'functional' ]]; then
  bash ./tests/cypress/scripts/kind-cluster.sh
fi

# check and load options.yaml
OPTIONS_FILE=/resources/options.yaml
if [ -f $OPTIONS_FILE ]; then
  echo "Processing options file..."
  BASE_DOMAIN=`yq r $OPTIONS_FILE 'options.hub.baseDomain'`
  export CYPRESS_BASE_URL="https://multicloud-console.apps.$BASE_DOMAIN"
  export CYPRESS_OCP_CLUSTER_URL="https://api.$BASE_DOMAIN:6443"
  export CYPRESS_OCP_CLUSTER_USER=`yq r $OPTIONS_FILE 'options.hub.user'`
  export CYPRESS_OCP_CLUSTER_PASS=`yq r $OPTIONS_FILE 'options.hub.password'`
  export CYPRESS_OC_IDP=`yq r $OPTIONS_FILE 'options.identityProvider'`

  npm run test:parse-options
else
  if [[ $CYPRESS_TEST_MODE != "functional" ]]; then
    echo "Options file not found..."
    exit 1
  fi
fi

echo "Logging into Kube API server..."
oc login --server=$CYPRESS_OCP_CLUSTER_URL -u $CYPRESS_OCP_CLUSTER_USER -p $CYPRESS_OCP_CLUSTER_PASS --insecure-skip-tls-verify

echo "Running tests (group: $TEST_GROUP) on $CYPRESS_BASE_URL in $CYPRESS_TEST_MODE mode..."
testCode=0
if [[ $TEST_GROUP == "aws" ]] || [[ $TEST_GROUP == "google" ]] || [[ $TEST_GROUP == "azure" ]]; then
  npx cypress run --browser $BROWSER --headless --spec ./tests/cypress/tests/01-create/**/*.spec.js
elif [[ $TEST_GROUP == "import" ]]; then
  npx cypress run --browser $BROWSER --headless --spec ./tests/cypress/tests/02-import/**/*.spec.js
elif [[ $TEST_GROUP == "validate" ]]; then
  npx cypress run --browser $BROWSER --headless --spec ./tests/cypress/tests/03-validate/**/*.spec.js
elif [[ $TEST_GROUP == "destroy" ]]; then
  npx cypress run --browser $BROWSER --headless --spec ./tests/cypress/tests/04-destroy/**/*.spec.js
else
  npx cypress run --browser $BROWSER --headless
fi
testCode=$?

mkdir /results
mkdir /results/recordings
mkdir /results/recordings/$TEST_GROUP

echo "Merging xml reports..."
npm run test:merge-xml
cp ./tests/test-output/*.xml /results
ls -al /results

echo "Copying recordings to results"
cp ./tests/cypress/videos/**/*.mp4 /results/recordings/$TEST_GROUP
ls -al /results/recordings/$TEST_GROUP

if [ ! -z "$SLACK_TOKEN" ]; then
  echo "Slack integration is configured; processing..."
  npm run test:slack
fi

# if [[ $CYPRESS_TEST_MODE == "functional" ]]; then
#   echo "Cleaning up functional test resources..."
#   bash ./tests/cypress/scripts/hub-detach.sh console-ui-test-cluster-aws-$CYPRESS_RESOURCE_ID
#   bash ./tests/cypress/scripts/hub-detach.sh console-ui-test-cluster-google-$CYPRESS_RESOURCE_ID
#   bash ./tests/cypress/scripts/hub-detach.sh console-ui-test-cluster-azure-$CYPRESS_RESOURCE_ID
#   bash ./tests/cypress/scripts/hub-detach.sh console-ui-test-import-cluster-$CYPRESS_RESOURCE_ID
#   bash ./tests/cypress/scripts/resource-cleanup.sh
# fi

if [[ $TEST_GROUP == "destroy" ]]; then
  echo "Cleaning up test resources..."
  bash ./tests/cypress/scripts/hub-detach.sh all
fi

exit $testCode
