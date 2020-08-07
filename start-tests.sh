#!/bin/bash

###############################################################################
# Copyright (c) 2020 Red Hat, Inc.
###############################################################################

echo "Initiating tests..."

if [ -z "$BROWSER" ]; then
  echo "BROWSER not exported; setting to 'chrome (options available: 'chrome', 'firefox')'"
  export BROWSER="chrome"
fi

# Load test config mounted at /resources/options.yaml
OPTIONS_FILE=/resources/options.yaml
if [ -f $OPTIONS_FILE ]; then
  echo "Processing options file..."
  export CYPRESS_OPTIONS_HUB_BASEDOMAIN=`yq r $OPTIONS_FILE 'options.hub.baseDomain'`
  export CYPRESS_OPTIONS_HUB_USER=`yq r $OPTIONS_FILE 'options.hub.user'`
  export CYPRESS_OPTIONS_HUB_PASSWORD=`yq r $OPTIONS_FILE 'options.hub.password'`
else
  echo -e "File '/resources/options.yaml' does not exist, using test config from environment variables.\n"
fi

export CYPRESS_BASE_URL=https://multicloud-console.apps.$CYPRESS_OPTIONS_HUB_BASEDOMAIN

echo -e "Target environment:\n"
echo -e "\tCYPRESS_OPTIONS_HUB_BASEDOMAIN : $CYPRESS_OPTIONS_HUB_BASEDOMAIN"
echo -e "\tCYPRESS_OPTIONS_HUB_BASE_URL   : $CYPRESS_BASE_URL"
echo -e "\tCYPRESS_OPTIONS_HUB_USER       : $CYPRESS_OPTIONS_HUB_USER"
echo -e "\nLogging into Kube API server\n"
oc login --server=https://api.${CYPRESS_OPTIONS_HUB_BASEDOMAIN}:6443 -u $CYPRESS_OPTIONS_HUB_USER -p $CYPRESS_OPTIONS_HUB_PASSWORD --insecure-skip-tls-verify

echo "Running tests on https://multicloud-console.apps.$CYPRESS_OPTIONS_HUB_BASEDOMAIN"
testCode=0

# We are caching the cypress binary for containerization, therefore it does not need npx. However, locally we need it.
if [ "$NODE_ENV" == "dev" ]; then
  npx cypress run --browser $BROWSER --headless --spec ./tests/cypress/tests/**/*.spec.js --reporter cypress-multi-reporters  
else
  cypress run --browser $BROWSER --headless --spec ./tests/cypress/tests/**/*.spec.js --reporter cypress-multi-reporters
fi

testCode=$?

echo "Merging XML and JSON reports..."
npm run test:merge-reports

ls -al ./results/**/*

exit $testCode
