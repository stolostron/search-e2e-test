#!/bin/bash

###############################################################################
# Copyright (c) 2020 Red Hat, Inc.
###############################################################################

####################
## COLORS
####################
CYAN="\033[0;36m"
GREEN="\033[0;32m"
PURPLE="\033[0;35m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
NC="\033[0m"

log_color () {
  case $1 in
    cyan)
      echo -e "${CYAN}$2 ${NC}"$3
    ;;
    green)
      echo -e "${GREEN}$2 ${NC}"$3
    ;;
    purple)
      echo -e "${PURPLE}$2 ${NC}"$3
    ;;
    red)
      echo -e "${RED}$2 ${NC}"$3
    ;;
    yellow)
      echo -e "${YELLOW}$2 ${NC}"$3
    ;;
  esac
}

log_color "cyan" "Initiating Search E2E tests...\n"

if [ -z "$BROWSER" ]; then
  log_color "purple" "BROWSER" "not exported; setting to 'chrome' (options available: 'chrome', 'firefox')\n"
  export BROWSER="chrome"
fi

# Load test config mounted at /resources/options.yaml
OPTIONS_FILE=/resources/options.yaml
USER_OPTIONS_FILE=./resources/options.yaml

# Load test kubeconfig mounted at /opt/.kube/config and /opt/.kube/import-kubeconfig
HUB_KUBECONFIG=${HUB_KUBECONFIG:-'/opt/.kube/config'}
MANAGED_KUBECONFIG=${MANAGED_KUBECONFIG:-'/opt/.kube/import-kubeconfig'}

# Check to see if the test config options file is mounted/available.
if [ -f $OPTIONS_FILE ]; then
  log_color "yellow" "Using test config from: $OPTIONS_FILE\n"
  export CYPRESS_OC_IDP=`yq e '.options.identityProvider' $OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_BASEDOMAIN=`yq e '.options.hub.baseDomain' $OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_USER=`yq e '.options.hub.user' $OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_PASSWORD=`yq e '.options.hub.password' $OPTIONS_FILE`
  export OPTIONS_HUB_BASEDOMAIN=`yq e '.options.hub.baseDomain' $OPTIONS_FILE`
  export OPTIONS_HUB_USER=`yq e '.options.hub.user' $OPTIONS_FILE`
  export OPTIONS_HUB_PASSWORD=`yq e '.options.hub.password' $OPTIONS_FILE`
elif [ -f $USER_OPTIONS_FILE ]; then
  log_color "yellow" "Using test config from: $USER_OPTIONS_FILE\n"
  export CYPRESS_OC_IDP=`yq e '.options.identityProvider' $USER_OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_BASEDOMAIN=`yq e '.options.hub.baseDomain' $USER_OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_USER=`yq e '.options.hub.user' $USER_OPTIONS_FILE`
  export CYPRESS_OPTIONS_HUB_PASSWORD=`yq e '.options.hub.password' $USER_OPTIONS_FILE`
  export OPTIONS_HUB_BASEDOMAIN=`yq e '.options.hub.baseDomain' $USER_OPTIONS_FILE`
  export OPTIONS_HUB_USER=`yq e '.options.hub.user' $USER_OPTIONS_FILE`
  export OPTIONS_HUB_PASSWORD=`yq e '.options.hub.password' $USER_OPTIONS_FILE`
else
  log_color "yellow" "Options file does not exist, checking to see if the test can be configured with environment variables."
fi

# Check to see if CYPRESS_OC_IDP is null.
if [[ -z $CYPRESS_OC_IDP || "$CYPRESS_OC_IDP" == "null" ]]; then
  log_color "purple" "CYPRESS_OC_IDP" "is (null or not set); setting to 'kube:admin'\n"
  export CYPRESS_OC_IDP=kube:admin
fi

if [[ -z $OPTIONS_HUB_BASEDOMAIN || -z $OPTIONS_HUB_USER || -z $OPTIONS_HUB_PASSWORD ]]; then
  log_color "red" "One or more exported variables are undefined for hub cluster." "(set ${PURPLE}OPTIONS_HUB_BASEDOMAIN, OPTIONS_HUB_BASEDOMAIN, and OPTIONS_HUB_BASEDOMAIN${NC} to execute the test with environment variables)\n"

  if [ ! -f $HUB_KUBECONFIG ]; then
    log_color "red" "The kubeconfig file for hub cluster was not located." "(set ${PURPLE}KUBECONFIG${NC} to ${YELLOW}${HUB_KUBECONFIG}${NC} and oc login to create kubeconfig file."
    exit 1
  else
    # Exporting this variable so cypress will know to use the kubeconfig file for the hub cluster.
    export CYPRESS_USE_HUB_KUBECONFIG=true

    echo -e "Kubeconfig file detected at: ${HUB_KUBECONFIG} => copying to ./config/hub-kubeconfig"
    cp $HUB_KUBECONFIG ./config/hub-kubeconfig
    export CYPRESS_HUB_KUBECONFIG=./config/hub-kubeconfig

    HUB_CLUSTER=($(oc config get-clusters --kubeconfig=./config/hub-kubeconfig))
    export CYPRESS_HUB_CLUSTER_CONTEXT=default/${HUB_CLUSTER[1]}/kube:admin

    oc config use-context --kubeconfig=$HUB_KUBECONFIG $CYPRESS_HUB_CLUSTER_CONTEXT
    echo -e

    export CYPRESS_OPTIONS_HUB_BASEDOMAIN=$(oc whoami --show-server=true | cut -d'.' -f2- | cut -d':' -f1)
    export OPTIONS_HUB_BASEDOMAIN=$CYPRESS_OPTIONS_HUB_BASEDOMAIN

    if [[ $CYPRESS_OC_IDP == "kube:admin" && -z $CYPRESS_OPTIONS_HUB_USER ]]; then
      export CYPRESS_OPTIONS_HUB_USER=kubeadmin
    fi

    log_color "purple" "HUB CLUSTER:" "${CYPRESS_OPTIONS_HUB_BASEDOMAIN}"
  fi
else
  echo -e "Environment variables detected. Configuring tests to execute with exported variables."
  export CYPRESS_OPTIONS_HUB_BASEDOMAIN=$OPTIONS_HUB_BASEDOMAIN
  export CYPRESS_OPTIONS_HUB_USER=$OPTIONS_HUB_USER
  export CYPRESS_OPTIONS_HUB_PASSWORD=$OPTIONS_HUB_PASSWORD
fi

echo -e

export CYPRESS_BASE_URL=https://multicloud-console.apps.$CYPRESS_OPTIONS_HUB_BASEDOMAIN

log_color "cyan" "Running tests with the following environment:\n"
log_color "purple" "\tCYPRESS_OPTIONS_HUB_BASEDOMAIN" "\t: $CYPRESS_OPTIONS_HUB_BASEDOMAIN"
log_color "purple" "\tCYPRESS_OPTIONS_HUB_BASE_URL" "\t: $CYPRESS_BASE_URL"
log_color "purple" "\tCYPRESS_OPTIONS_HUB_USER" "\t: $CYPRESS_OPTIONS_HUB_USER"
log_color "purple" "\tCYPRESS_OC_IDP" "\t\t\t: $CYPRESS_OC_IDP\n"

if [ -z $CYPRESS_USE_HUB_KUBECONFIG ]; then
  log_color "cyan" "Logging into Kube API server"
  oc login --server=https://api.${CYPRESS_OPTIONS_HUB_BASEDOMAIN}:6443 -u $CYPRESS_OPTIONS_HUB_USER -p $CYPRESS_OPTIONS_HUB_PASSWORD --insecure-skip-tls-verify
fi

MANAGED_CLUSTERS=($(oc get managedclusters -o custom-columns='name:.metadata.name' --no-headers))

if [ ${#MANAGED_CLUSTERS[@]} == "1" ]; then
  echo -e "No managable clusters detected for the hub cluster: $CYPRESS_OPTIONS_HUB_BASEDOMAIN.\n"
  export CYPRESS_SKIP_MANAGED_CLUSTER_TEST=true
else
  echo -e "Detected clusters within the fleet: ${GREEN}${MANAGED_CLUSTERS[@]}${NC}\n"

  if [[ -z $OPTIONS_MANAGED_BASEDOMAIN || -z $OPTIONS_MANAGED_USER || -z $OPTIONS_MANAGED_PASSWORD ]]; then
    log_color "red" "One or more variables are undefined for imported cluster." "(set ${PURPLE}OPTIONS_MANAGED_BASEDOMAIN, OPTIONS_MANAGED_BASEDOMAIN, and OPTIONS_MANAGED_BASEDOMAIN${NC} to execute the test with environment variables)\n"

    if [ ! -f $MANAGED_KUBECONFIG ]; then
      log_color "red" "The kubeconfig file for imported cluster was not located." "(set ${PURPLE}KUBECONFIG${NC} to ${YELLOW}${MANAGED_KUBECONFIG}${NC} and oc login to create kubeconfig file."
      echo -e "Skipping managed cluster test.\n"
      export CYPRESS_SKIP_MANAGED_CLUSTER_TEST=true
    else
      # Exporting this variable so cypress will know to use the kubeconfig file for the imported cluster.
      export CYPRESS_USE_MANAGED_KUBECONFIG=true
      export CYPRESS_SKIP_MANAGED_CLUSTER_TEST=false

      echo -e "Kubeconfig file detected at: ${MANAGED_KUBECONFIG} - copying to ./config/hub-kubeconfig"
      cp $MANAGED_KUBECONFIG ./config/import-kubeconfig
      export CYPRESS_MANAGED_KUBECONFIG=./config/import-kubeconfig

      MANAGED_CLUSTER=($(oc config get-clusters --kubeconfig=./config/import-kubeconfig))
      export CYPRESS_MANAGED_CLUSTER_CONTEXT=default/${MANAGED_CLUSTER[1]}/kube:admin

      export OPTIONS_MANAGED_BASEDOMAIN=$(echo ${MANAGED_CLUSTER[1]} | cut -d'-' -f2- | cut -d':' -f1)
      export CYPRESS_OPTIONS_MANAGED_BASEDOMAIN=$OPTIONS_MANAGED_BASEDOMAIN
      export OPTIONS_MANAGED_USER=kubeadmin
      export CYPRESS_OPTIONS_MANAGED_USE=$OPTIONS_MANAGED_USER

      log_color "purple" "IMPORTED CLUSTER:" "${CYPRESS_OPTIONS_MANAGED_BASEDOMAIN}\n"
      # oc config use-context --kubeconfig=$MANAGED_KUBECONFIG default/${MANAGED_CLUSTER[1]}/kube:admin
    fi
  else
    echo -e "Environment variables detected. Configuring tests to execute with imported cluster exported variables."
    export CYPRESS_OPTIONS_MANAGED_BASEDOMAIN=$OPTIONS_MANAGED_BASEDOMAIN
    export CYPRESS_OPTIONS_MANAGED_USER=$OPTIONS_MANAGED_USER
    export CYPRESS_OPTIONS_MANAGED_PASSWORD=$OPTIONS_MANAGED_PASSWORD
  fi
fi

testCode=0

VERSION=`oc get subscriptions.operators.coreos.com -A -o yaml | grep currentCSV:\ advanced-cluster-management | awk '{$1=$1};1' | sed "s/currentCSV:\ advanced-cluster-management.v//"`
log_color "purple" "Testing with ACM Version": "$VERSION\n"

# Exclude RBAC test from ROSA cluster builds.
if [[ "https://api.${CYPRESS_OPTIONS_HUB_BASEDOMAIN}:6443" =~ "openshiftapps.com" ]]; then
  log_color "yellow" "ROSA cluster detected - excluding @rbac tests\n"
  if [[ -z "$CYPRESS_TAGS_EXCLUDE" ]]; then
    export CYPRESS_TAGS_EXCLUDE="@rbac"
  else
    export CYPRESS_TAGS_EXCLUDE="@rbac $CYPRESS_TAGS_EXCLUDE"
  fi
fi

# Include only test cases filtered for the canary builds.
if [[ "https://api.${CYPRESS_OPTIONS_HUB_BASEDOMAIN}:6443" =~ "canary" ]]; then
  log_color "yellow" "Canary cluster detected - filtering test to only include @canary tests cases\n"
  if [[ -z "$CYPRESS_TAGS_INCLUDE" ]]; then
    export CYPRESS_TAGS_INCLUDE="@canary"
  else
    export CYPRESS_TAGS_INCLUDE="@canary $CYPRESS_TAGS_INCLUDE"
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

log_color "yellow" "Setting env to run in:" "$NODE_ENV\n"

if [ -z "$SKIP_API_TEST" ]; then
  log_color "purple" "SKIP_API_TEST" "not exported; setting to false (set ${PURPLE}SKIP_API_TEST${NC} to true, if you wish to skip the API tests)"
  export SKIP_API_TEST=false
fi

if [ -z "$SKIP_UI_TEST" ]; then
  log_color "purple" "SKIP_UI_TEST" "not exported; setting to false (set ${PURPLE}SKIP_UI_TEST${NC} to true, if you wish to skip the UI tests)\n"
  export SKIP_UI_TEST=false
fi

if [ -z $CYPRESS_USE_HUB_KUBECONFIG ]; then
  log_color "cyan" "Create RBAC users"
  if [ -f /rbac-setup.sh ]; then
    chmod +x /rbac-setup.sh
    source /rbac-setup.sh
  else # DEV
    chmod +x build/rbac-setup.sh
    source build/rbac-setup.sh
  fi
else
  echo -e "Running test with kubeconfig file for hub cluster. Excluding RBAC test cases."
  export CYPRESS_TAGS_EXCLUDE='@rbac'
fi

echo -e

if [[ -z $CYPRESS_TAGS_EXCLUDE ]]; then
  log_color "purple" "CYPRESS_TAGS_EXCLUDE" "not exported; running all test (set ${PURPLE}CYPRESS_TAGS_EXCLUDE${NC} to include a test tags i.e ${YELLOW}@critical${NC}, if you wish to exclude a test from the execution)\n"
else
  log_color "purple" "Excluding tests that contain the following tags: ${YELLOW}$CYPRESS_TAGS_EXCLUDE${NC}"
fi

if [ "$SKIP_API_TEST" == false ]; then 
  log_color "cyan" "Running Search API tests.\n"
  npm run test:api
else
  log_color "purple" "SKIP_API_TEST" "was set to true. Skipping API tests"
fi

if [ -z "$RECORD" ]; then
  log_color "purple" "RECORD" "not exported; setting to false (set ${PURPLE}RECORD${NC} to true, if you wish to view results within dashboard)\n"
  export RECORD=false
fi

env | grep "cypress" -i

if [ "$SKIP_UI_TEST" == false ]; then
  if [ "$RECORD" == true ]; then
    echo -e "Preparing to run test within record mode. (Results will be displayed within dashboard)\n"
    cypress run --record --key $RECORD_KEY --browser $BROWSER $DISPLAY --spec "./tests/cypress/tests/**/*.spec.js" --reporter cypress-multi-reporters --env VERSION=$VERSION,NODE_ENV=$NODE_ENV,grepTags="-$CYPRESS_TAGS_EXCLUDE"
  fi

  log_color "cyan" "Running Search UI tests."
  if [ "$NODE_ENV" == "development" ]; then
    cypress run --browser $BROWSER $DISPLAY --spec "./tests/cypress/tests/**/*.spec.js" --reporter cypress-multi-reporters --env VERSION=$VERSION,NODE_ENV=$NODE_ENV,grepTags="-$CYPRESS_TAGS_EXCLUDE"
  elif [ "$NODE_ENV" == "debug" ]; then
    cypress open --browser $BROWSER --config numTestsKeptInMemory=0 --env VERSION=$VERSION,NODE_ENV=$NODE_ENV,grgrepTags="-$CYPRESS_TAGS_EXCLUDE"
  else 
    cypress run --browser $BROWSER $DISPLAY --spec "./tests/cypress/tests/**/*.spec.js" --reporter cypress-multi-reporters --env VERSION=$VERSION,NODE_ENV=$NODE_ENV,grepTags="-$CYPRESS_TAGS_EXCLUDE"
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

log_color "cyan" "Clean up RBAC setup"
if [ -f /rbac-clean.sh ]; then
  chmod +x /rbac-clean.sh
  source /rbac-clean.sh
else # DEV
  chmod +x build/rbac-clean.sh
  source build/rbac-clean.sh
fi

exit $testCode
