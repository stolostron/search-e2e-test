#!/bin/bash
# Copyright (c) 2021 Red Hat, Inc.
# Copyright Contributors to the Open Cluster Management project

set -e

echo -e "Shared Directory: $SHARED_DIR\n"

cat /tmp/secret/hub-1.json

# Env variables
export SKIP_API_TEST=true

export OPTIONS_HUB_BASEDOMAIN=$(echo $HUB_CREDS | jq -r '.api_url')
export OPTIONS_HUB_USER=$(echo $HUB_CREDS | jq -r '.username')
export OPTIONS_HUB_PASSWORD=$(echo $HUB_CREDS | jq -r '.password')

# Cypress env variables
export CYPRESS_TEST_MODE=BVT

echo -e "Environment Variables"
env

echo -e "Running Search E2E tests in ${CYPRESS_TEST_MODE} test mode."

# npm run test