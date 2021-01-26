#!/bin/bash

# Copyright (c) 2020 Red Hat, Inc


function install_aws_cli() {
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q -o awscliv2.zip
    sudo ./aws/install -i ./aws-cli -b /home/travis/bin

    echo "Validate AWS cli install running [ sudo /home/travis/bin/aws --version ]"
    sudo /home/travis/bin/aws --version
    echo " >> ls ./aws-cli/v2/current"
    ls aws-cli/v2/current
    echo " >> ls -la /home/travis/bin"
    ls -la /home/travis/bin

}

# copies the test results to the search-e2e-test S3 bucket
function upload_s3() {
    install_aws_cli
    echo "Uploading files to AWS S3 bucket.  search-e2e-test/travis-${TRAVIS_BUILD_ID}"  

    sudo home/travis/bin/aws s3 sync ./search-test-results s3://search-e2e-results/travis-${TRAVIS_BUILD_ID}
}