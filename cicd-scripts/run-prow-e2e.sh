#!/bin/bash
# Copyright (c) 2021 Red Hat, Inc.
# Copyright Contributors to the Open Cluster Management project

set -e

# Test env
BROWSER=chrome

export OPTIONS_HUB_KUBECONFIG="${SHARED_DIR}/hub-1.kc"
export OPTIONS_MANAGED_KUBECONFIG="${SHARED_DIR}/managed-1.kc"

echo -e "$SHARED_DIR\n"

# Hub cluster
HUB_CREDS=$(cat ${SHARED_DIR}/hub-1.json)

echo -e $HUB_CREDS

export OPTIONS_HUB_BASEDOMAIN=$(echo $HUB_CREDS | jq -r '.api_url')
export OPTIONS_HUB_USER=$(echo $HUB_CREDS | jq -r '.username')
export OPTIONS_HUB_PASSWORD=$(echo $HUB_CREDS | jq -r '.password')

# Managed cluster
MANAGED_CREDS=$(cat ${SHARED_DIR}/managed-1.json)

echo -e $MANAGED_CREDS

export OPTIONS_MANAGED_BASEDOMAIN=$(echo $MANAGED_CREDS | jq -r '.api_url')
export OPTIONS_MANAGED_USER=$(echo $MANAGED_CREDS | jq -r '.username')
export OPTIONS_MANAGED_PASSWORD=$(echo $MANAGED_CREDS | jq -r '.password')

# Env variables
export SKIP_API_TEST=true
export TEST_MODE=BVT

env | grep "OPTIONS"

echo -e "\nRunning Search E2E tests in ${CYPRESS_TEST_MODE} test mode."

# npm run test

exit 0