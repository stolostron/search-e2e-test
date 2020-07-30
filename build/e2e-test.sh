#!/bin/bash

###############################################################################
# Copyright (c) 2020 Red Hat, Inc.
###############################################################################

set -e

export UI_CURRENT_IMAGE=$1

function fold_start() {
  echo -e "travis_fold:start:$1\033[33;1m$2\033[0m"
}

function fold_end() {
  echo -e "\ntravis_fold:end:$1\r"
}

fold_start test-setup "Test Setup"

make oc/install
oc login -u ${OPTIONS_HUB_USER} -p ${OPTIONS_HUB_PASSWORD} --server=https://api.${OPTIONS_HUB_BASEDOMAIN}:6443 --insecure-skip-tls-verify
export SERVICEACCT_TOKEN=`${BUILD_HARNESS_PATH}/vendor/oc whoami --show-token`

fold_end test-setup

fold_start cypress "Functional Tests"
make run-test-image-pr
fold_end cypress
