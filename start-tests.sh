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

log_color () {
  case $1 in
    yellow)
      echo -e "${YELLOW}$2 ${NC}"$3
    ;;
    cyan)
      echo -e "${CYAN}$2 ${NC}"$3
    ;;
    purple)
      echo -e "${PURPLE}$2 ${NC}"$3
    ;;
  esac
}

log_color "cyan" "Initiating Search E2E tests...\n"

if [ -z "$BROWSER" ]; then
  log_color "purple" "BROWSER" "not exported; setting to 'chrome' (options available: 'chrome', 'firefox')"
  export BROWSER="chrome"
fi

# Load test config mounted at /resources/options.yaml
OPTIONS_FILE=/resources/options.yaml
USER_OPTIONS_FILE=./options.yaml

if [ -f $OPTIONS_FILE ]; then
  log_color "yellow" "Using test config from: $OPTIONS_FILE\n"
  export CYPRESS_OPTIONS_HUB_OC_IDP=`yq e '.options.identityProvider' $OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_BASEDOMAIN=`yq e '.options.hub.baseDomain' $OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_USER=`yq e '.options.hub.user' $OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_PASSWORD=`yq e '.options.hub.password' $OPTIONS_FILE`
  export CYPRESS_OPTIONS_MANAGED_CLUSTER_NAME=`yq e '.options.clusters[0].name' $OPTIONS_FILE`
  export OPTIONS_HUB_BASEDOMAIN=`yq e '.options.hub.baseDomain' $OPTIONS_FILE`
  export OPTIONS_HUB_USER=`yq e '.options.hub.user' $OPTIONS_FILE`
  export OPTIONS_HUB_PASSWORD=`yq e '.options.hub.password' $OPTIONS_FILE`
  export OPTIONS_MANAGED_CLUSTER_NAME=`yq e '.options.clusters[0].name' $OPTIONS_FILE`
elif [ -f $USER_OPTIONS_FILE ]; then
  log_color "yellow" "Using test config from: $USER_OPTIONS_FILE\n"
  export CYPRESS_OPTIONS_HUB_OC_IDP=`yq e '.options.identityProvider' $USER_OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_BASEDOMAIN=`yq e '.options.hub.baseDomain' $USER_OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_USER=`yq e '.options.hub.user' $USER_OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_PASSWORD=`yq e '.options.hub.password' $USER_OPTIONS_FILE`
  export CYPRESS_OPTIONS_MANAGED_CLUSTER_NAME=`yq e '.options.clusters[0].name' $USER_OPTIONS_FILE`
  export OPTIONS_HUB_BASEDOMAIN=`yq e '.options.hub.baseDomain' $USER_OPTIONS_FILE`
  export OPTIONS_HUB_USER=`yq e '.options.hub.user' $USER_OPTIONS_FILE`
  export OPTIONS_HUB_PASSWORD=`yq e '.options.hub.password' $USER_OPTIONS_FILE`
  export OPTIONS_MANAGED_CLUSTER_NAME=`yq e '.options.clusters[0].name' $USER_OPTIONS_FILE`
else
  log_color "yellow" "Options file does not exist, using test config from environment variables.\n"
fi

export CYPRESS_BASE_URL=https://multicloud-console.apps.$CYPRESS_OPTIONS_HUB_BASEDOMAIN

# Check to see if CYPRESS_OPTIONS_HUB_OC_IDP is null.
if [[ -z $CYPRESS_OPTIONS_HUB_OC_IDP || "$CYPRESS_OPTIONS_HUB_OC_IDP" == "null" ]]; then
  log_color "purple" "CYPRESS_OPTIONS_HUB_OC_IDP" "is (null or not set); setting to 'kube:admin'\n"
  export CYPRESS_OPTIONS_HUB_OC_IDP=kube:admin
fi

log_color "cyan" "Running tests with the following environment:\n"
log_color "purple" "\tCYPRESS_OPTIONS_HUB_BASEDOMAIN" "\t: $CYPRESS_OPTIONS_HUB_BASEDOMAIN"
log_color "purple" "\tCYPRESS_OPTIONS_HUB_BASE_URL" "\t: $CYPRESS_BASE_URL"
log_color "purple" "\tCYPRESS_OPTIONS_HUB_USER" "\t: $CYPRESS_OPTIONS_HUB_USER"
log_color "purple" "\tCYPRESS_OPTIONS_HUB_OC_IDP" "\t\t\t: $CYPRESS_OPTIONS_HUB_OC_IDP\n"

if [[ -z $OPTIONS_MANAGED_BASEDOMAIN || -z $OPTIONS_MANAGED_USER || -z $OPTIONS_MANAGED_PASSWORD ]]; then
   log_color "yellow" "One or more variables are undefined. Copying kubeconfigs...\n"
   cp /opt/.kube/import-kubeconfig ./config/import-kubeconfig
   echo $OPTIONS_KUBECONFIG_MOUNT_PATH
else
  log_color "cyan" "Logging into the managed cluster using credentials and generating the kubeconfig..."
  mkdir ./import-kubeconfig && touch ./import-kubeconfig/kubeconfig
  export KUBECONFIG=$(pwd)/import-kubeconfig/kubeconfig
  export OPTIONS_MANAGED_URL="https://api.$OPTIONS_MANAGED_BASEDOMAIN:6443"
  oc login --server=$OPTIONS_MANAGED_URL -u $OPTIONS_MANAGED_USER -p $OPTIONS_MANAGED_PASSWORD --insecure-skip-tls-verify
  unset KUBECONFIG
  log_color "yellow" "Copying managed cluster kubeconfig to ./cypress/config/import-kubeconfig ...\n"
  cp ./import-kubeconfig/* ./config/import-kubeconfig
fi

log_color "cyan" "Logging into Kube API server"
oc login --server=https://api.${CYPRESS_OPTIONS_HUB_BASEDOMAIN}:6443 -u $CYPRESS_OPTIONS_HUB_USER -p $CYPRESS_OPTIONS_HUB_PASSWORD --insecure-skip-tls-verify

testCode=0

VERSION=`oc get subscriptions.operators.coreos.com -A -o yaml | grep currentCSV:\ advanced-cluster-management | awk '{$1=$1};1' | sed "s/currentCSV:\ advanced-cluster-management.v//"`
log_color "purple" "Testing with ACM Version: $VERSION"

echo -e

if [[ "https://api.${CYPRESS_OPTIONS_HUB_BASEDOMAIN}:6443" =~ "canary" || "$TEST_ENV" == "canary" ]]; then
  log_color "yellow" "Canary cluster environment detected - running test that are tagged with @canary, @required, and @bvt.\n"

  # Running canary test. We want to run all tests that are marked required and that are bvt
  if [[ -z "$CYPRESS_TAGS_INCLUDE" ]]; then
    export CYPRESS_TAGS_INCLUDE="@canary+@required @canary+@bvt"
  else
    export CYPRESS_TAGS_INCLUDE="@canary+@required @canary+@bvt $CYPRESS_TAGS_INCLUDE"
  fi
fi

if [[ "https://api.${CYPRESS_OPTIONS_HUB_BASEDOMAIN}:6443" =~ "openshiftapps.com" || "$TEST_ENV" == "rosa" ]]; then
  log_color "yellow" "ROSA cluster environment detected - excluding test that are tagged with @rosa and @rbac.\n"
  
  # Running rosa test. We want to run all tests that are marked rosa but exclude 
  if [[ -z "$CYPRESS_TAGS_EXCLUDE" ]]; then
    export CYPRESS_TAGS_EXCLUDE="@rosa+-@rbac"
  else
    export CYPRESS_TAGS_EXCLUDE="@rosa+-@rbac $CYPRESS_TAGS_EXCLUDE"
  fi
fi

log_color "cyan" "Checking RedisGraph deployment."
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
DISPLAY="--headless"
if [[ "$LIVE_MODE" == true ]]; then
  DISPLAY="--headed"
fi

if [ -z "$NODE_ENV" ]; then
  export NODE_ENV="production" || set NODE_ENV="production"
fi

if [ -z "$SKIP_API_TEST" ]; then
  log_color "purple" "SKIP_API_TEST" "not exported; setting to false (set ${PURPLE}SKIP_API_TEST${NC} to true, if you wish to skip the API tests)"
  export SKIP_API_TEST=false
fi

if [ -z "$SKIP_UI_TEST" ]; then
  log_color "purple" "SKIP_UI_TEST" "not exported; setting to false (set ${PURPLE}SKIP_UI_TEST${NC} to true, if you wish to skip the UI tests)\n"
  export SKIP_UI_TEST=false
fi

log_color "yellow" "Setting env to run in:" "$NODE_ENV\n"

if [[ -z $CYPRESS_TAGS_INCLUDE ]]; then
  log_color "purple" "CYPRESS_TAGS_INCLUDE" "not exported; set ${PURPLE}CYPRESS_TAGS_INCLUDE${NC} to include a test tags i.e ${YELLOW}@canary${NC}, if you wish to execute on a subset of tests)"
else
  log_color "purple" "Including tests that only contain the following tags: ${YELLOW}$CYPRESS_TAGS_INCLUDE${NC}"
  CYPRESS_TAGS=$CYPRESS_TAGS_INCLUDE
fi

if [[ -z $CYPRESS_TAGS_EXCLUDE ]]; then
  log_color "purple" "CYPRESS_TAGS_EXCLUDE" "not exported; set ${PURPLE}CYPRESS_TAGS_EXCLUDE${NC} to include a test tags i.e ${YELLOW}@critical${NC}, if you wish to exclude a test from the execution)\n"
else
  log_color "purple" "Excluding tests that contain the following tags: ${YELLOW}$CYPRESS_TAGS_EXCLUDE${NC}"
fi

if [[ ! -z $CYPRESS_TAGS_INCLUDE || ! -z $CYPRESS_TAGS_EXCLUDE ]]; then
  CYPRESS_TAGS="$CYPRESS_TAGS_INCLUDE $CYPRESS_TAGS_EXCLUDE"

  echo -e "Executing tests with the following tags: $CYPRESS_TAGS\n"
fi

if [ "$SKIP_API_TEST" == false ]; then 
  log_color "cyan" "Running Search API tests."
  npm run test:api
else
  log_color "purple" "SKIP_API_TEST" "was set to true. Skipping API tests"
fi

echo -e

if [ -z "$RECORD" ]; then
  log_color "purple" "RECORD" "not exported; setting to false (set ${PURPLE}RECORD${NC} to true, if you wish to view results within dashboard)\n"
  export RECORD=false
fi

if [ "$SKIP_UI_TEST" == false ]; then
  log_color "cyan" "Create RBAC users"
  if [ -f /rbac-setup.sh ]; then
    chmod +x /rbac-setup.sh
    source /rbac-setup.sh
  else # DEV
    chmod +x build/rbac-setup.sh
    source build/rbac-setup.sh
  fi

  echo -e

  if [ "$RECORD" == true ]; then
    echo -e "Preparing to run test within record mode. (Results will be displayed within dashboard)\n"
    cypress run --record --key $RECORD_KEY --browser $BROWSER $DISPLAY --spec "./tests/cypress/tests/**/*.spec.js" --reporter cypress-multi-reporters --env VERSION=$VERSION,NODE_ENV=$NODE_ENV,grepTags="${CYPRESS_TAGS:-}"
  fi

  log_color "cyan" "Running Search UI tests."
  if [ "$NODE_ENV" == "development" ]; then
    cypress run --browser $BROWSER $DISPLAY --spec "./tests/cypress/tests/**/*.spec.js" --reporter cypress-multi-reporters --env VERSION=$VERSION,NODE_ENV=$NODE_ENV,grepTags="${CYPRESS_TAGS:-}"
  elif [ "$NODE_ENV" == "debug" ]; then
    cypress open --browser $BROWSER --config numTestsKeptInMemory=0 --env VERSION=$VERSION,NODE_ENV=$NODE_ENV,grepTags=$CYPRESS_TAGS
  else
    cypress run --browser $BROWSER $DISPLAY --spec "./tests/cypress/tests/**/*.spec.js" --reporter cypress-multi-reporters --env VERSION=$VERSION,NODE_ENV=$NODE_ENV,grepTags="${CYPRESS_TAGS:-}"
  fi
else
  log_color "purple" "SKIP_UI_TEST" "was set to true. Skipping UI tests\n"
fi

testCode=$?

if [[ "$SKIP_UI_TEST" == false && "$SKIP_API_TEST" == false ]]; then
  log_color "cyan" "Merging XML and JSON reports..."
  npm run test:merge-reports
  ls -R results
fi

if [[ "$SKIP_UI_TEST" == false ]]; then
  log_color "cyan" "Clean up RBAC setup"
  if [ -f /rbac-clean.sh ]; then
    chmod +x /rbac-clean.sh
    source /rbac-clean.sh
  else # DEV
    chmod +x build/rbac-clean.sh
    source build/rbac-clean.sh
  fi
fi

exit $testCode
