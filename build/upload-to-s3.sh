#!/bin/bash

# Copyright (c) 2020 Red Hat, Inc


function install_aws_cli() {
    aws_dir=$(dirname $(readlink -f $0))
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q -o awscliv2.zip

    # ./aws/install -i $aws_dir/aws-cli -b /home/travis/bin
}

# copies the test results to the search-e2e-test S3 bucket
function upload_s3() {
    echo -ne "Uploading test results to AWS S3 bucket... search-e2e-test/prow-${PROW_BUILD_ID}"
    aws s3 sync ./results s3://search-e2e-results/prow-${PROW_BUILD_ID}
}
