#!/bin/bash

# Copyright (c) 2020 Red Hat, Inc


make run-test-image-pr

echo "Uploading test results to AWS S3 bucket."
echo "e2e-test.sh >>> pwd:"
pwd
sudo source ./build/upload-to-s3.sh
sudo install_aws_cli
sudo upload_s3

echo "Test results uploaded to: https://s3.console.aws.amazon.com/s3/buckets/search-e2e-results?region=us-east-1&prefix=travis-${TRAVIS_BUILD_ID}/&showversions=false"