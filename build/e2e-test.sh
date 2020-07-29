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

export OC_CLUSTER_URL=$OPTIONS_HUB_BASEDOMAIN
export OC_CLUSTER_USER=$OPTIONS_HUB_USER
export OC_CLUSTER_PASS=$OPTIONS_HUB_PASSWORD

make oc/install
make oc/login

export SERVICEACCT_TOKEN=`${BUILD_HARNESS_PATH}/vendor/oc whoami --show-token`

docker network create --subnet 10.10.0.0/16 test-network

pids=()
for script in ./build/e2e/*; do
  echo "Running $script"
  bash $script &
  pids+=($!)
done

for pid in ${pids[*]}; do
  wait $pid
done

docker container ls -a

fold_end test-setup

fold_start cypress "Functional Tests"
make run-test-image-pr
fold_end cypress
