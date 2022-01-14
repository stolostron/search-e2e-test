#!/bin/bash
# Copyright (c) 2021 Red Hat, Inc.
# Copyright Contributors to the Open Cluster Management project

set -e

echo -e "Shared Directory: $SHARED_DIR\n"

# Cypress env variables
export CYPRESS_TEST_MODE=BVT

echo -e "Running Search E2E tests in ${CYPRESS_TEST_MODE} test mode."