#!/bin/bash

# Copyright (c) 2020 Red Hat, Inc


function install_aws_cli() {
    my_dir=$(dirname $(readlink -f $0))
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q -o awscliv2.zip
    ./aws/install -i $my_dir/aws-cli -b /home/travis/bin

    echo "Setup AWS credentials"
    echo "aws_access_key_id = " $AWS_ACCESS_KEY_ID > ./aws/credentials
    echo "aws_secret_access_key = " $AWS_SECRET_ACCESS_KEY >> ./aws/credentials
}

# copies the test results to the search-e2e-test S3 bucket
function post_s3() {
    echo "Uploading files to AWS S3 bucket.  search-e2e-test/travis-${TRAVIS_BUILD_ID}"  

    aws s3 sync ./search-test-results s3://search-e2e-results/travis-${TRAVIS_BUILD_ID}
    set +x
}