#!/bin/bash

# Copyright (c) 2020 Red Hat, Inc

function install_aws_cli() {
    echo -e "Installing AWS CLI.\n"

    aws_dir=$(dirname $(readlink -f $0))
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q -o awscliv2.zip

    if [[ $PROW_MODE == true ]]; then
        ./aws/install -i $aws_dir/aws-cli -b /usr/local/bin
    else
        ./aws/install -i $aws_dir/aws-cli -b /home/travis/bin
    fi
}

# copies the test results to the search-e2e-test S3 bucket
function upload_s3() {
    echo -ne "Uploading test results to AWS S3 bucket..."
    if [[ $PROW_MODE == true ]]; then
        echo -e "search-e2e-test/prow-${PROW_BUILD_ID}"
        aws s3 sync ./results s3://search-e2e-results/prow-${PROW_BUILD_ID}
    else
        echo -e "search-e2e-test/travis-${TRAVIS_BUILD_ID}"
        aws s3 sync ./search-test-results s3://search-e2e-results/travis-${TRAVIS_BUILD_ID}
    fi
}
