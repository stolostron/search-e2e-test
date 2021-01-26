#!/bin/bash

# Copyright (c) 2020 Red Hat, Inc


function install_aws_cli() {
    aws_dir=$(dirname $(readlink -f $0))
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q -o awscliv2.zip
    sudo ./aws/install -i $aws_dir/aws-cli -b /home/travis/bin

    echo "Validate AWS cli install running [ sudo /home/travis/bin/aws --version ]"
    $aws_dir/aws-cli/v2/current/bin/aws --version
    echo ">>> aws --version"
    aws --version
    echo " >> ls ./aws-cli/v2/current/bin"
    ls $aws_dir/aws-cli/v2/current/bin

    echo "Printing PATH"
    echo $PATH
}

# copies the test results to the search-e2e-test S3 bucket
function upload_s3() {
    echo "Uploading files to AWS S3 bucket.  search-e2e-test/travis-${TRAVIS_BUILD_ID}"  

    aws s3 sync ./search-test-results s3://search-e2e-results/travis-${TRAVIS_BUILD_ID}
}