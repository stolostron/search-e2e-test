#!/bin/bash

###############################################################################
# Copyright (c) 2020 Red Hat, Inc.
###############################################################################

set -e

UI_CURRENT_IMAGE=$1

function fold_start() {
  echo -e "travis_fold:start:$1\033[33;1m$2\033[0m"
}

function fold_end() {
  echo -e "\ntravis_fold:end:$1\r"
}

fold_start test-setup "Test Setup"

export OC_CLUSTER_URL=$OPTIONS_HUB_BASEDOMAIN
export OC_CLUSTER_USER=$OPTIONS_HUB_USER
export OC_CLUSTER_PASS=$OPTIONS_HUB_PASSWORD

make oc/install
make oc/login

