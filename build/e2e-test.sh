#!/bin/bash

# Copyright (c) 2020 Red Hat, Inc


make run-test-image-pr

echo "Uploading test results to AWS S3 bucket."
source ./build/upload-to-s3.sh
install_aws_cli
upload_s3

echo "Test results uploaded to: https://s3.console.aws.amazon.com/s3/buckets/search-e2e-results?region=us-east-1&prefix=travis-${TRAVIS_BUILD_ID}/&showversions=false"