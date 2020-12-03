#!/bin/bash

# Copyright (c) 2020 Red Hat, Inc

set -e

make run-test-image-pr

echo "Upload test results to AWS S3 bucket: search-e2e-tests/travis-${TRAVIS_BUILD_ID}"
source ./build/post-to-s3.sh
install_aws_cli
post_s3