#!/bin/bash

###############################################################################
# Copyright (c) 2020 Red Hat, Inc.
###############################################################################
set -e

###############################################################################
# Test Setup
###############################################################################

echo $SHARED_DIR


HUB_CREDS=$(cat "${SHARED_DIR}/hub-1.json")
export KUBECONFIG="${SHARED_DIR}/hub-1.kc" 

OCM_ADDRESS=https://`oc -n $OCM_NAMESPACE get route $OCM_ROUTE -o json | jq -r '.spec.host'`
export CYPRESS_BASE_URL=$OCM_ADDRESS 
export OPTIONS_HUB_BASEDOMAIN=$(echo $HUB_CREDS | jq -r '.api_url') 
export OPTIONS_HUB_USER=$(echo $HUB_CREDS | jq -r '.username') 
export OPTIONS_HUB_PASSWORD=$(echo $HUB_CREDS | jq -r '.password') 
./run-prow-e2e-tests.sh