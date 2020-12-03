#!/bin/bash

# Copyright (c) 2020 Red Hat, Inc


function install_aws_cli() {
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q -o awscliv2.zip
    ./aws/install -i ./aws-cli -b /home/travis/bin
}

# copies the test results to the search-e2e-test S3 bucket
function upload_s3() {
    install_aws_cli
    echo "Uploading files to AWS S3 bucket.  search-e2e-test/travis-${TRAVIS_BUILD_ID}"  

    aws s3 sync ./search-test-results s3://search-e2e-results/travis-${TRAVIS_BUILD_ID}
}