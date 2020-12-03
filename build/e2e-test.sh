#!/bin/bash

# Copyright (c) 2020 Red Hat, Inc

set -e

export UI_CURRENT_IMAGE=$1

function fold_start() {
  echo -e "travis_fold:start:$1\033[33;1m$2\033[0m"
}

function fold_end() {
  echo -e "\ntravis_fold:end:$1\r"
}

fold_start cypress "Search Tests"
make run-test-image-pr
fold_end cypress


fold_start results "Upload results to S3 bucket search-e2e-results"
source ./build/post-to-s3.sh
install_aws_cli
post_s3
fold_end results