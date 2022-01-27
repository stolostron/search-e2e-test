#!/bin/bash
# Copyright (c) 2021 Red Hat, Inc.
# Copyright Contributors to the Open Cluster Management project

###############################################################################
# Test Setup
###############################################################################

echo -e "Shared dir: $SHARED_DIR\n"

ls -la

# Test env
export BROWSER=chrome
export OPTIONS_HUB_KUBECONFIG=${SHARED_DIR}/hub-1.kc
export OPTIONS_KUBECONFIG_MOUNT_PATH=${SHARED_DIR}/managed-1.kc
export OPTIONS_MANAGED_KUBECONFIG=${OPTIONS_KUBECONFIG_MOUNT_PATH}
export PROW_MODE=true
export SKIP_API_TEST=false
export SKIP_UI_TEST=false
export TEST_MODE=BVT

# Hub cluster
HUB_CREDS=$(cat ${SHARED_DIR}/hub-1.json)
export OPTIONS_HUB_CONSOLE_NAME=$(yq e '.console_url' $SHARED_DIR/hub-1.json)
export OPTIONS_HUB_BASEDOMAIN=${OPTIONS_HUB_CONSOLE_NAME:39}
export OPTIONS_HUB_USER=$(yq e '.username' $SHARED_DIR/hub-1.json)
export OPTIONS_HUB_PASSWORD=$(yq e '.password' $SHARED_DIR/hub-1.json)

# Managed cluster
MANAGED_CREDS=$(cat ${SHARED_DIR}/managed-1.json)
export OPTIONS_MANAGED_BASEDOMAIN=$(yq e '.api_url' $SHARED_DIR/managed-1.json)
export OPTIONS_MANAGED_USER=$(yq e '.username' $SHARED_DIR/managed-1.json)
export OPTIONS_MANAGED_PASSWORD=$(yq e '.password' $SHARED_DIR/managed-1.json)

echo -e "\nRunning Search E2E tests in ${CYPRESS_TEST_MODE} test mode."
./start-tests.sh
