#!/bin/bash

# Copyright (c) 2020 Red Hat, Inc

my_dir=$(dirname $(readlink -f $0))

function install_aws_cli() {
    echo "my_dir: " $my_dir
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q -o awscliv2.zip
    ./aws/install -i $my_dir/aws-cli -b /home/travis/bin

    echo "Setup AWS credentials"
    echo "aws_access_key_id = " $AWS_ACCESS_KEY_ID > ./aws/credentials
    echo "aws_secret_access_key = " $AWS_SECRET_ACCESS_KEY >> ./aws/credentials
  
#   mkdir -p $my_dir/TMP
#   cd $my_dir/TMP
#   echo "getting data for ... ${TRAVIS_BUILD_ID}"
#   aws s3 cp --recursive --quiet s3://$RESULTS_S3_BUCKET/data/${TRAVIS_BUILD_ID} .
}

function post_s3() {
    echo "Uploading files to AWS S3 bucket"

    # mkdir -p $my_dir/TMP/${TRAVIS_BUILD_ID}${POST_S3_SUFFIX}
    # cp  -r $1/* $my_dir/TMP/${TRAVIS_BUILD_ID}${POST_S3_SUFFIX}/
  
  
    # cd $my_dir/TMP
    # copies travis_build_id/results.xml to data
    aws s3 sync --quiet ./search-test-results s3://search-e2e-results/data/
    set +x
}