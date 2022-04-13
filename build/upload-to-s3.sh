#!/bin/bash

# Copyright (c) 2020 Red Hat, Inc

function install_aws_cli() {
    # Set operating system.
    OS=$(uname)

    aws_dir=$(dirname $(readlink -f $0))

    # Check to see if aws is installed on the current machine.
    if ! command -v aws &> /dev/null; then
        echo "AWS is not installed. Preparing to install AWS CLI with for OS: $OS."

        if [[ "$OS" == "Darwin" ]]; then
            # Replace temp user with current user.
            sed -i -r "s#<string>/Users/myusername</string>#<string>/Users/$(whoami)</string>#" assets/aws-macos.xml

            curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
            installer -pkg AWSCLIV2.pkg \
            -target CurrentUserHomeDirectory \
            -applyChoiceChangesXML assets/aws-macos.xml

        elif [[ "$OS" == "Linux" ]]; then
            curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
            unzip -q -o awscliv2.zip
            ./aws/install -i $aws_dir/aws-cli -b /usr/local/bin --update

        elif [[ "$OS" == "Windows" ]]; then
            msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

        else
            echo -e "[WARNING] OS: $OS is not supported by the current application."
        fi
    else
        echo -e "AWS CLI is already installed on the current machine."
    fi
}

# copies the test results to the search-e2e-test S3 bucket
function upload_s3() {
    echo -e "Uploading test results to AWS S3 bucket... search-e2e-test/prow-${BUILD_ID}"
    aws s3 sync ./results s3://search-e2e-results/prow-${BUILD_ID}
}
