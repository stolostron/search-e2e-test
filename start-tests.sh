#!/bin/bash

###############################################################################
# Copyright Contributors to the Open Cluster Management project
###############################################################################

source ./scripts/log-colors.sh
log_color "cyan" "Initiating Search E2E tests...\n"

# Create directory for kubeconfigs.
mkdir -p ./kube/config

# Load test config mounted at /resources/options.yaml
OPTIONS_FILE=/resources/options.yaml
USER_OPTIONS_FILE=./resources/options.yaml

# Load test kubeconfig mounted at /opt/.kube/config and /opt/.kube/import-kubeconfig
OPTIONS_HUB_KUBECONFIG=${OPTIONS_HUB_KUBECONFIG:-'/opt/.kube/config'}
OPTIONS_MANAGED_KUBECONFIG=${OPTIONS_MANAGED_KUBECONFIG:-'/opt/.kube/import-kubeconfig'}

# Check to see if the test config options file is mounted/available.
if [[ -f $OPTIONS_FILE ]]; then
  log_color "yellow" "Using test config from: $OPTIONS_FILE\n"
  export OPTIONS_HUB_BASEDOMAIN=`yq e '.options.hub.baseDomain' $OPTIONS_FILE`
  export OPTIONS_HUB_KUBECONTEXT=`yq e '.options.hub.kubecontext' $OPTIONS_FILE`
  export OPTIONS_HUB_OC_IDP=`yq e '.options.identityProvider' $OPTIONS_FILE`
  export OPTIONS_HUB_PASSWORD=`yq e '.options.hub.password' $OPTIONS_FILE`
  export OPTIONS_HUB_USER=`yq e '.options.hub.user' $OPTIONS_FILE`
  export OPTIONS_MANAGED_BASEDOMAIN=`yq e '.options.clusters[0].baseDomain' $OPTIONS_FILE`
  export OPTIONS_MANAGED_CLUSTER_NAME=`yq e '.options.clusters[0].name' $OPTIONS_FILE`
  export OPTIONS_MANAGED_KUBECONFIG=`yq e '.options.clusters[0].kubeconfig' $OPTIONS_FILE`
elif [[ -f $USER_OPTIONS_FILE ]]; then
  log_color "yellow" "Using test config from: $USER_OPTIONS_FILE\n"
  export OPTIONS_HUB_BASEDOMAIN=`yq e '.options.hub.baseDomain' $USER_OPTIONS_FILE`
  export OPTIONS_HUB_KUBECONTEXT=`yq e '.options.hub.kubecontext' $USER_OPTIONS_FILE`
  export OPTIONS_HUB_OC_IDP=`yq e '.options.identityProvider' $USER_OPTIONS_FILE`
  export OPTIONS_HUB_PASSWORD=`yq e '.options.hub.password' $USER_OPTIONS_FILE`
  export OPTIONS_HUB_USER=`yq e '.options.hub.user' $USER_OPTIONS_FILE`
  export OPTIONS_MANAGED_BASEDOMAIN=`yq e '.options.clusters[0].baseDomain' $USER_OPTIONS_FILE`
  export OPTIONS_MANAGED_CLUSTER_NAME=`yq e '.options.clusters[0].name' $USER_OPTIONS_FILE`
  export OPTIONS_MANAGED_KUBECONFIG=`yq e '.options.clusters[0].kubeconfig' $USER_OPTIONS_FILE`
else
  log_color "yellow" "Options file does not exist, checking to see if the test can be configured with environment variables.\n"
fi

# Check to see if OPTIONS_HUB_OC_IDP is unset or null.
if [[ -z $OPTIONS_HUB_OC_IDP || "$OPTIONS_HUB_OC_IDP" == "null" ]]; then
  log_color "purple" "OPTIONS_HUB_OC_IDP" "not exported or null, setting to default: 'kube:admin'.\n"
  export OPTIONS_HUB_OC_IDP=kube:admin

else
  log_color "purple" "OPTIONS_HUB_OC_IDP" "detected, using $OPTIONS_HUB_OC_IDP for test.\n"
fi

# Check to see if OPTIONS_HUB_USER is unset or null.
if [[ -z $OPTIONS_HUB_USER || "$OPTIONS_HUB_USER" == "null" ]]; then
  log_color "purple" "OPTIONS_HUB_USER" "not exported or null, setting to default user: 'kubeadmin'\n"
  export OPTIONS_HUB_USER=kubeadmin

else
  log_color "purple" "OPTIONS_HUB_USER" "detected, using $OPTIONS_HUB_USER for test.\n"
fi

# Check to see if OPTIONS_HUB_BASEDOMAIN, or OPTIONS_HUB_PASSWORD are missing.
if [[ -z $OPTIONS_HUB_BASEDOMAIN || -z $OPTIONS_HUB_PASSWORD ]]; then
  log_color "red" "One or more exported variables are undefined for hub cluster." "(set ${PURPLE}OPTIONS_HUB_BASEDOMAIN and OPTIONS_HUB_PASSWORD${NC} to execute the test with environment variables)\n"

  # Check to see if the kubeconfig for the hub cluster is available.
  if [[ ! -f $OPTIONS_HUB_KUBECONFIG ]]; then
    log_color "red" "The kubeconfig file for the hub cluster was not located." "(set ${PURPLE}KUBECONFIG${NC} to ${YELLOW}$OPTIONS_HUB_KUBECONFIG${NC} and oc login to create kubeconfig file)"
    exit 1
  else
    echo -e "Kubeconfig file detected at: $OPTIONS_HUB_KUBECONFIG => ${YELLOW}copying to ./kube/config/hub-kubeconfig${NC}"
    cp $OPTIONS_HUB_KUBECONFIG ./kube/config/hub-kubeconfig
    export OPTIONS_HUB_KUBECONFIG=./kube/config/hub-kubeconfig

    # Check to see if there are any kubecontext to be used from the hub cluster kubeconfig.
    if [[ -z $OPTIONS_HUB_KUBECONTEXT || "$OPTIONS_HUB_KUBECONTEXT" == "null" ]]; then
      HUB_CLUSTER=($(oc config get-clusters --kubeconfig=$OPTIONS_HUB_KUBECONFIG))
      export OPTIONS_HUB_KUBECONTEXT=default/${HUB_CLUSTER[1]}/$OPTIONS_HUB_OC_IDP
    fi

    echo -e
    log_color "cyan" "Switching context to log into Kube API server"
    oc config use-context --kubeconfig=$OPTIONS_HUB_KUBECONFIG $OPTIONS_HUB_KUBECONTEXT
    
    export OPTIONS_HUB_BASEDOMAIN=$(oc whoami --show-server=true | cut -d'.' -f2- | cut -d':' -f1)

    log_color "purple" "HUB CLUSTER:" "$OPTIONS_HUB_BASEDOMAIN"
  fi
else
  echo -e "Environment variables detected for hub cluster. Configuring tests to execute with exported variables."
fi

echo -e

if [[ ! -z $OPTIONS_HUB_PASSWORD && "$OPTIONS_HUB_PASSWORD" != "null" ]]; then
  log_color "cyan" "Logging into Kube API server."

  export KUBECONFIG=./kube/config/hub-kubeconfig
  touch $KUBECONFIG

  # ensure server starts with https://api.
  server=$OPTIONS_HUB_BASEDOMAIN
  if [[ ! $server =~ ^https://api\. ]]; then
    server="https://api.${server}"
  fi

  # ensure server ends with port :6443
  if [[ ! $server =~ :6443$ ]]; then
    server="${server}:6443"
  fi

  oc login --server=${server} -u $OPTIONS_HUB_USER -p $OPTIONS_HUB_PASSWORD --insecure-skip-tls-verify
  export OPTIONS_HUB_KUBECONFIG=$KUBECONFIG

  if [[ -f $OPTIONS_HUB_KUBECONFIG ]]; then
    echo -e "Succesfully detected hub cluster kubeconfig.\n"
  else
    echo -e "Failed to create or locate hub cluster kubeconfig.\n"
  fi
fi

echo -e "Logged in as user: $(oc whoami)\n"

export CYPRESS_ACM_VERSION=`oc get subscriptions.operators.coreos.com -A -o yaml | grep currentCSV:\ advanced-cluster-management | awk '{$1=$1};1' | sed "s/currentCSV:\ advanced-cluster-management.v//"`
log_color "green" "Testing with ACM Version": "$CYPRESS_ACM_VERSION\n"

installNamespace=`oc get subscriptions.operators.coreos.com --all-namespaces | grep advanced-cluster-management | awk '{print $1}'`

# Search for managed clusters.
MANAGED_CLUSTERS=($(oc get managedclusters -o custom-columns='name:.metadata.name' --no-headers))

# Check to see if there are any managed cluster available.
if [[ ${#MANAGED_CLUSTERS[@]} == "1" && ${MANAGED_CLUSTERS[0]} =~ "local-cluster" ]]; then
  echo -e "No managable clusters detected for the hub cluster: $OPTIONS_HUB_BASEDOMAIN.\n"
  export SKIP_MANAGED_CLUSTER_TEST=true
else
  echo -e "Detected clusters within the fleet: ${GREEN}${MANAGED_CLUSTERS[@]}${NC}\n"

  if [[ -z $OPTIONS_MANAGED_BASEDOMAIN || -z $OPTIONS_MANAGED_USER || -z $OPTIONS_MANAGED_PASSWORD ]]; then
    log_color "red" "One or more exported variables are undefined for imported cluster." "(set ${PURPLE}OPTIONS_MANAGED_BASEDOMAIN, OPTIONS_MANAGED_USER, and OPTIONS_MANAGED_PASSWORD${NC} to execute the test with environment variables)\n"

    # The mount path will be set by CICD.
    if [[ ! -z $OPTIONS_KUBECONFIG_MOUNT_PATH ]]; then
      echo -e "Detected kubeconfig mount path for imported cluster at: $OPTIONS_KUBECONFIG_MOUNT_PATH"
      OPTIONS_MANAGED_KUBECONFIG=$OPTIONS_KUBECONFIG_MOUNT_PATH
    fi

    # Check to see if the kubeconfig for the managed cluster is available.
    if [[ ! -f $OPTIONS_MANAGED_KUBECONFIG ]]; then
      log_color "red" "The kubeconfig file for imported cluster was not located." "(set ${PURPLE}KUBECONFIG${NC} to ${YELLOW}$OPTIONS_MANAGED_KUBECONFIG${NC} and oc login to create kubeconfig file)"
      echo -e "Skipping managed cluster test.\n"
      export SKIP_MANAGED_CLUSTER_TEST=true
    else
      export SKIP_MANAGED_CLUSTER_TEST=false

      echo -e "Kubeconfig file detected at: $OPTIONS_MANAGED_KUBECONFIG => ${YELLOW}copying to ./kube/config/import-kubeconfig${NC}\n"
      cp $OPTIONS_MANAGED_KUBECONFIG ./kube/config/import-kubeconfig
      export OPTIONS_MANAGED_KUBECONFIG=./kube/config/import-kubeconfig

      MANAGED_CLUSTER=($(oc config get-clusters --kubeconfig=$OPTIONS_MANAGED_KUBECONFIG))

      export OPTIONS_MANAGED_BASEDOMAIN=${OPTIONS_MANAGED_BASEDOMAIN:-MANAGED_CLUSTER[1]}
      export OPTIONS_MANAGED_USER=kubeadmin

      log_color "purple" "IMPORTED CLUSTER:" "$OPTIONS_MANAGED_BASEDOMAIN\n"
    fi
  else
    echo -e "Environment variables detected for managed cluster. Configuring tests to execute with imported cluster exported variables.\n"
    log_color "cyan" "Logging into the managed cluster using credentials and generating the kubeconfig..."

    OPTIONS_MANAGED_URL="https://api.$OPTIONS_MANAGED_BASEDOMAIN:6443"

    export KUBECONFIG=./kube/config/import-kubeconfig
    touch $KUBECONFIG
    
    oc login --server=$OPTIONS_MANAGED_URL -u $OPTIONS_MANAGED_USER -p $OPTIONS_MANAGED_PASSWORD --insecure-skip-tls-verify
    export OPTIONS_MANAGED_KUBECONFIG=$KUBECONFIG
    unset KUBECONFIG

    if [[ -f $OPTIONS_MANAGED_KUBECONFIG ]]; then
      echo -e "Successfully detected managed cluster kubeconfig.\n"
    else
      echo -e "Failed to create or locate managed cluster kubeconfig.\n"
    fi
  fi
fi

export KUBECONFIG=$OPTIONS_HUB_KUBECONFIG

log_color "cyan" "Running tests with the following imported cluster environment:\n"
log_color "purple" "\tOPTIONS_MANAGED_BASEDOMAIN" "\t: $OPTIONS_MANAGED_BASEDOMAIN"
log_color "purple" "\tOPTIONS_MANAGED_CLUSTER_NAME" "\t: $OPTIONS_MANAGED_CLUSTER_NAME\n"

if [[ -z $NODE_ENV ]]; then
  export NODE_ENV="production" || set NODE_ENV="production"
fi

log_color "green" "Setting env to run in:" "$NODE_ENV\n"

if [[ "$PROW_MODE" == true ]]; then
  echo -e "Checking pod status in $installNamespace:"
  oc get pods $ADD_KUBECONFIG -n $installNamespace
  echo -e

  echo -e "Waiting for an additional 2 minutes to ensure that all pods are up and running in the cluster."
  sleep 120
fi

echo "Waiting up to 10 minutes for search pods to reach Running status"
SEARCH_RUNNING="false"
ATTEMPTS=0
MAX_ATTEMPTS=60
INTERVAL=10
while [[ "${SEARCH_RUNNING}" == "false" ]] && (( ATTEMPTS != MAX_ATTEMPTS )); do
  RUNNING_SEARCH_PODS_COUNT=($(oc get pods --all-namespaces -l app=search --field-selector=status.phase==Running --no-headers | wc -l))
  if [ "${SEARCH_RUNNING}" == "false" ] && [ "$RUNNING_SEARCH_PODS_COUNT" -ge 5 ]; then
    SEARCH_RUNNING="true"
    echo "Search Pods are Running."
  fi
  if [[ "$SEARCH_RUNNING" == "false" ]]; then
    echo "Search Pods are not Running. Waiting another ${INTERVAL}s for pod update (Retry $((++ATTEMPTS))/${MAX_ATTEMPTS})"
    sleep ${INTERVAL}
  else
    echo "Proceeding with test setup"
  fi
done

if [[ -z $ACM_NAMESPACE || "$ACM_NAMESPACE" == "null" ]]; then
  ACM_NAMESPACE="open-cluster-management"
fi
export CYPRESS_ACM_NAMESPACE=$ACM_NAMESPACE

log_color "cyan" "Running Search API tests."

if [[ "$PROW_MODE" == true ]]; then
  npm run test:api:prow
else
  npm run test:api
fi

TEST_EXIT_CODE=$?

if [[ $TEST_EXIT_CODE -ne 0 ]]; then
  echo "API tests failed. Exit code: ${TEST_EXIT_CODE}"
else
  echo "API tests passed. Exit code: ${TEST_EXIT_CODE}"
fi

exit $TEST_EXIT_CODE
