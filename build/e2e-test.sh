#!/bin/bash

###############################################################################
# Copyright (c) 2020 Red Hat, Inc.
###############################################################################

set -e

# export OC_CLUSTER_URL=$OPTIONS_HUB_BASEDOMAIN
# export OC_CLUSTER_USER=$OPTIONS_HUB_USER
# export OC_CLUSTER_PASS=$OPTIONS_HUB_PASSWORD

# make oc/install
# make oc/login

make run-test-image-pr
