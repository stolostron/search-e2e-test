#!/bin/bash

###############################################################################
# Copyright (c) 2020 Red Hat, Inc.
###############################################################################

####################
## COLORS
####################
PURPLE="\033[0;35m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
NC="\033[0m"

echo -e "${CYAN}Initiating Search E2E tests${NC}..."

section_title () {
  printf "\n$(tput bold)$1 $(tput sgr0)\n"
}

if [ -z "$BROWSER" ]; then
  echo -e "\n${PURPLE}BROWSER${NC} not exported; setting to 'chrome' (options available: 'chrome', 'firefox')"
  export BROWSER="chrome"
fi

# Load test config mounted at /resources/options.yaml
OPTIONS_FILE=/resources/options.yaml
USER_OPTIONS_FILE=./options.yaml

if [ -f $OPTIONS_FILE ]; then
  echo "Using test config from: $OPTIONS_FILE"
  export CYPRESS_OC_IDP=`yq e '.options.identityProvider' $OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_BASEDOMAIN=`yq e '.options.hub.baseDomain' $OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_USER=`yq e '.options.hub.user' $OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_PASSWORD=`yq e '.options.hub.password' $OPTIONS_FILE`
  export OPTIONS_HUB_BASEDOMAIN=`yq e '.options.hub.baseDomain' $OPTIONS_FILE`
  export OPTIONS_HUB_USER=`yq e '.options.hub.user' $OPTIONS_FILE`
  export OPTIONS_HUB_PASSWORD=`yq e '.options.hub.password' $OPTIONS_FILE`
elif [ -f $USER_OPTIONS_FILE ]; then
  echo "Using test config from: $USER_OPTIONS_FILE"
  export CYPRESS_OC_IDP=`yq e '.options.identityProvider' $USER_OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_BASEDOMAIN=`yq e '.options.hub.baseDomain' $USER_OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_USER=`yq e '.options.hub.user' $USER_OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_PASSWORD=`yq e '.options.hub.password' $USER_OPTIONS_FILE`
  export OPTIONS_HUB_BASEDOMAIN=`yq e '.options.hub.baseDomain' $USER_OPTIONS_FILE`
  export OPTIONS_HUB_USER=`yq e '.options.hub.user' $USER_OPTIONS_FILE`
  export OPTIONS_HUB_PASSWORD=`yq e '.options.hub.password' $USER_OPTIONS_FILE`
else
  echo -e "Options file does not exist, using test config from environment variables.\n"
fi

export CYPRESS_BASE_URL=https://multicloud-console.apps.$CYPRESS_OPTIONS_HUB_BASEDOMAIN

# Check to see if CYPRESS_OC_IDP is null.
if [[ -z $CYPRESS_OC_IDP || "$CYPRESS_OC_IDP" == "null" ]]; then
  echo -e "${PURPLE}CYPRESS_OC_IDP${NC} is (null or not set); setting to 'kube:admin'\n"
  export CYPRESS_OC_IDP=kube:admin
fi

echo -e "${CYAN}Running tests with the following environment${NC}:\n"
echo -e "\t${PURPLE}CYPRESS_OPTIONS_HUB_BASEDOMAIN${NC} : $CYPRESS_OPTIONS_HUB_BASEDOMAIN"
echo -e "\t${PURPLE}CYPRESS_OPTIONS_HUB_BASE_URL${NC}   : $CYPRESS_BASE_URL"
echo -e "\t${PURPLE}CYPRESS_OPTIONS_HUB_USER${NC}       : $CYPRESS_OPTIONS_HUB_USER"
echo -e "\t${PURPLE}CYPRESS_OC_IDP${NC}                 : $CYPRESS_OC_IDP\n"

if [[ -z $OPTIONS_MANAGED_BASEDOMAIN || -z $OPTIONS_MANAGED_USER || -z $OPTIONS_MANAGED_PASSWORD ]]; then
   echo 'One or more variables are undefined. Copying kubeconfigs...'
   cp /opt/.kube/import-kubeconfig ./config/import-kubeconfig
else
  echo -e "${CYAN}Logging into the managed cluster using credentials and generating the kubeconfig${NC}..."
  mkdir ./import-kubeconfig && touch ./import-kubeconfig/kubeconfig
  export KUBECONFIG=$(pwd)/import-kubeconfig/kubeconfig
  export OPTIONS_MANAGED_URL="https://api.$OPTIONS_MANAGED_BASEDOMAIN:6443"
  oc login --server=$OPTIONS_MANAGED_URL -u $OPTIONS_MANAGED_USER -p $OPTIONS_MANAGED_PASSWORD --insecure-skip-tls-verify
  unset KUBECONFIG
  echo "Copying managed cluster kubeconfig to ./cypress/config/import-kubeconfig ..."
  cp ./import-kubeconfig/* ./config/import-kubeconfig
fi

echo -e "\n${CYAN}Logging into Kube API server${NC}\n"
oc login --server=https://api.${CYPRESS_OPTIONS_HUB_BASEDOMAIN}:6443 -u $CYPRESS_OPTIONS_HUB_USER -p $CYPRESS_OPTIONS_HUB_PASSWORD --insecure-skip-tls-verify

testCode=0

if [[ "https://api.${CYPRESS_OPTIONS_HUB_BASEDOMAIN}:6443" =~ "openshiftapps.com" ]]; then
  echo "ROSA cluster detected - excluding @rbac tests"
  if [[ -z "$CYPRESS_TAGS_EXCLUDE" ]]; then
    export CYPRESS_TAGS_EXCLUDE="@rbac"
  else
    export CYPRESS_TAGS_EXCLUDE="@rbac $CYPRESS_TAGS_EXCLUDE"
  fi
fi

echo -e "${CYAN}Checking RedisGraph deployment${NC}."
installNamespace=`oc get subscriptions.operators.coreos.com --all-namespaces | grep advanced-cluster-management | awk '{print $1}'`
rgstatus=`oc get srcho searchoperator -o jsonpath="{.status.deployredisgraph}" -n ${installNamespace}`

if [ "$rgstatus" == "true" ]; then
  echo -e "RedisGraph deployment is enabled.\n"
else
  echo -e "RedisGraph deployment disabled, enabling and waiting 60 seconds for the search-redisgraph-0 pod.\n"
  oc set env deploy search-operator DEPLOY_REDISGRAPH="true" -n $installNamespace
  sleep 60
fi

# We are caching the cypress binary for containerization, therefore it does not need npx. However, locally we need it.
HEADLESS="--headless"
if [[ "$LIVE_MODE" == true ]]; then
  HEADLESS=""
fi

if [ -z "$NODE_ENV" ]; then
  export NODE_ENV="production" || set NODE_ENV="production"
fi

if [ -z "$SKIP_API_TEST" ]; then
  echo -e "${PURPLE}SKIP_API_TEST${NC} not exported; setting to false (set ${PURPLE}SKIP_API_TEST${NC} to true, if you wish to skip the API tests)"
  export SKIP_API_TEST=false
fi

if [ -z "$SKIP_UI_TEST" ]; then
  echo -e "${PURPLE}SKIP_UI_TEST${NC} not exported; setting to false (set ${PURPLE}SKIP_UI_TEST${NC} to true, if you wish to skip the UI tests)\n"
  export SKIP_UI_TEST=false
fi

echo -e "Setting env to run in: $NODE_ENV\n"

echo -e "${CYAN}Create RBAC users${NC}"
if [ -f /rbac-setup.sh ]; then
  source /rbac-setup.sh
else # DEV
  source build/rbac-setup.sh
fi

if [[ -z $CYPRESS_TAGS_EXCLUDE ]]; then
  echo -e "\n${PURPLE}CYPRESS_TAGS_EXCLUDE${NC} not exported; running all test (set ${PURPLE}CYPRESS_TAGS_EXCLUDE${NC} to include a test tags i.e ${YELLOW}@critical${NC}, if you wish to exclude a test from the execution)"
else
  echo -e "\nExcluding tests that contain the following tags: ${YELLOW}$CYPRESS_TAGS_EXCLUDE${NC}\033[0m"
fi

echo -e "Checking pod status in $installNamespace:"
oc get pods $ADD_KUBECONFIG -n $installNamespace
echo -e

echo -e "DEBUG: Sleeping for an additional 30 seconds to ensure that the pod is up and running."
sleep 30

if [ "$SKIP_API_TEST" == false ]; then 
  section_title "${CYAN}Running Search API tests${NC}."
  npm run test:api
else
  echo -e "\n${PURPLE}SKIP_API_TEST${NC} was set to true. Skipping API tests"
fi

if [ -z "$RECORD" ]; then
  echo -e "${PURPLE}RECORD${NC} not exported; setting to false (set ${PURPLE}RECORD${NC} to true, if you wish to view results within dashboard)"
  export RECORD=false
fi

if [ "$SKIP_UI_TEST" == false ]; then
  if [ "$RECORD" == true ]; then
    echo "Preparing to run test within record mode. (Results will be displayed within dashboard)"
    cypress run --record --key $RECORD_KEY --browser $BROWSER $HEADLESS --spec "./tests/cypress/tests/**/*.spec.js" --reporter cypress-multi-reporters --env NODE_ENV=$NODE_ENV,grepTags="-$CYPRESS_TAGS_EXCLUDE"
  fi

  # Displaying cypress environment variables, so we know all of the ones that are being passed successfully.
  env | grep "cypress_" -i | grep -vi "password"
  echo -e

  section_title "${CYAN}Running Search UI tests${NC}."
  if [ "$NODE_ENV" == "development" ]; then
    cypress run --browser $BROWSER $HEADLESS --spec "./tests/cypress/tests/**/*.spec.js" --reporter cypress-multi-reporters --env NODE_ENV=$NODE_ENV,grepTags="-$CYPRESS_TAGS_EXCLUDE"
  elif [ "$NODE_ENV" == "debug" ]; then
    cypress open --browser $BROWSER --config numTestsKeptInMemory=0 --env NODE_ENV=$NODE_ENV,grgrepTags="-$CYPRESS_TAGS_EXCLUDE"
  else 
    cypress run --browser $BROWSER $HEADLESS --spec "./tests/cypress/tests/**/*.spec.js" --reporter cypress-multi-reporters --env NODE_ENV=$NODE_ENV,grepTags="-$CYPRESS_TAGS_EXCLUDE"
  fi
else
  echo -e "${PURPLE}SKIP_UI_TEST${NC} was set to true. Skipping UI tests\n"
fi

testCode=$?

if [[ "$SKIP_UI_TEST" == false && "$SKIP_API_TEST" == false ]]; then
  section_title "${CYAN}Merging XML and JSON reports${NC}..."
  npm run test:merge-reports
  ls -R results
fi

echo "${CYAN}Clean up RBAC setup${NC}"
if [ -f /rbac-clean.sh ]; then
  source /rbac-clean.sh
else # DEV
  source build/rbac-clean.sh
fi

exit $testCode
