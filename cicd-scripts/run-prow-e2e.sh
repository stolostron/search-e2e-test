#!/bin/bash
# Copyright (c) 2021 Red Hat, Inc.
# Copyright Contributors to the Open Cluster Management project

###############################################################################
# Test Setup
###############################################################################

echo -e "Shared dir: $SHARED_DIR\n"

# Test env
export BROWSER=chrome
export OPTIONS_HUB_KUBECONFIG=${SHARED_DIR}/hub-1.kc
export OPTIONS_KUBECONFIG_MOUNT_PATH=${SHARED_DIR}/managed-1.kc
export OPTIONS_MANAGED_KUBECONFIG=${OPTIONS_KUBECONFIG_MOUNT_PATH}
export SKIP_API_TEST=true
export SKIP_UI_TEST=false
export TEST_MODE=BVT

# Hub cluster
HUB_CREDS=$(cat ${SHARED_DIR}/hub-1.json)
OPTIONS_HUB_CONSOLE_NAME=$(echo $HUB_CREDS | jq -r '.console_url')

export OPTIONS_HUB_BASEDOMAIN=${OPTIONS_HUB_CONSOLE_NAME:39}
# export OPTIONS_HUB_BASEDOMAIN=$(echo $HUB_CREDS | jq -r '.api_url')
export OPTIONS_HUB_USER=$(echo $HUB_CREDS | jq -r '.username')
export OPTIONS_HUB_PASSWORD=$(echo $HUB_CREDS | jq -r '.password')

# Managed cluster
MANAGED_CREDS=$(cat ${SHARED_DIR}/managed-1.json)

export OPTIONS_MANAGED_BASEDOMAIN=$(echo $MANAGED_CREDS | jq -r '.api_url')
export OPTIONS_MANAGED_USER=$(echo $MANAGED_CREDS | jq -r '.username')
export OPTIONS_MANAGED_PASSWORD=$(echo $MANAGED_CREDS | jq -r '.password')

env | grep "OPTIONS"

echo -e "\nRunning Search E2E tests in ${CYPRESS_TEST_MODE} test mode."

. ./start-tests.sh

# exit 0
