#!/bin/bash

# Copyright (c) 2020 Red Hat, Inc.

mkdir clis-unpacked

# Check to see if CURL is installed on the current machine.
if ! command -v curl &> /dev/null; then
    apt-get update && apt-get install curl
fi

# Set operating system.
OS=$(uname)

# Set default installation.
VERSION=linux

# Install OpenShift and Kubectl CLI.
echo 'Installing oc and kubectl clis...'

if [[ "$OS" == 'Darwin' ]]; then
    VERSION=mac
fi

echo "Preparing to install OpenShift and Kubectl CLI for $(uname)."
curl -kLo oc.tar.gz https://mirror.openshift.com/pub/openshift-v4/clients/ocp/4.9.9/openshift-client-$VERSION-4.9.9.tar.gz
tar -xzf oc.tar.gz -C clis-unpacked

chmod 755 ./clis-unpacked/oc
chmod 755 ./clis-unpacked/kubectl
mv ./clis-unpacked/oc /usr/local/bin/oc
mv ./clis-unpacked/kubectl /usr/local/bin/kubectl

echo -e 'oc and kubectl cli install completed.'

# Install htpasswd utility
echo 'Installing htpasswd utility...'
apt-get update && apt-get install -y apache2-utils

echo 'htpasswd utilities install completed.'
