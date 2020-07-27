#!/bin/bash

# Copyright (c) 2020 Red Hat, Inc.

echo "Initiating tests..."

if [ -z "$BROWSER" ]; then
  echo "BROWSER not exported; setting to 'chrome (options available: 'chrome', 'firefox')'"
  export BROWSER="chrome"
fi

# check and load options.yaml
OPTIONS_FILE=/resources/options.yaml
if [ -f $OPTIONS_FILE ]; then
  echo "Processing options file..."
  BASE_DOMAIN=`yq r $OPTIONS_FILE 'options.hub.baseDomain'`
  export CYPRESS_BASE_URL="https://multicloud-console.apps.$BASE_DOMAIN"
  export CYPRESS_OCP_CLUSTER_URL="https://api.$BASE_DOMAIN:6443"
  export CYPRESS_OCP_CLUSTER_USER=`yq r $OPTIONS_FILE 'options.hub.user'`
  export CYPRESS_OCP_CLUSTER_PASS=`yq r $OPTIONS_FILE 'options.hub.password'`,


  npm run test:parse-options
else
  if [[ $CYPRESS_TEST_MODE != "functional" ]]; then
    echo "Options file not found..."
    exit 1
  fi
fi

echo "Logging into Kube API server..."
oc login --server=$CYPRESS_OCP_CLUSTER_URL -u $CYPRESS_OCP_CLUSTER_USER -p $CYPRESS_OCP_CLUSTER_PASS --insecure-skip-tls-verify

echo "Running tests on $CYPRESS_BASE_URL"
testCode=0
npx cypress run --browser $BROWSER --headless --spec ./tests/cypress/tests/**/*.spec.js

testCode=$?

mkdir /results
mkdir /results/recordings

echo "Merging xml reports..."
npm run test:merge-xml
cp ./tests/test-output/*.xml /results
ls -al /results

echo "Copying recordings to results"
cp ./tests/cypress/videos/**/*.mp4 /results/recordings
ls -al /results/recordings

exit $testCode
