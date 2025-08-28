#!/bin/bash
# Copyright Contributors to the Open Cluster Management project

# Exit if command fails
set -e 

mkdir clis-unpacked

# Install curl command
apt-get -y update; apt-get -y install curl

# Install OpenShift and Kubectl CLI.
echo 'Installing oc and kubectl clis...'
curl -kLo oc.tar.gz https://mirror.openshift.com/pub/openshift-v4/clients/ocp/4.11.3/openshift-client-linux-4.11.3.tar.gz
tar -xzf oc.tar.gz -C clis-unpacked
chmod 755 ./clis-unpacked/oc
chmod 755 ./clis-unpacked/kubectl
mv ./clis-unpacked/oc /usr/local/bin/oc
mv ./clis-unpacked/kubectl /usr/local/bin/kubectl
rm -rf ./clis-unpacked

echo -e 'oc and kubectl cli install completed.'

# Install htpasswd utility
echo 'Installing htpasswd utility...'
apt-get install -y apache2-utils

echo 'htpasswd utilities install completed.'
