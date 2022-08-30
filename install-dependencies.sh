#!/bin/bash

# Copyright Contributors to the Open Cluster Management project

mkdir clis-unpacked

# Install OpenShift and Kubectl CLI.
echo 'Installing oc and kubectl clis...'
curl -kLo oc.tar.gz https://mirror.openshift.com/pub/openshift-v4/clients/ocp/4.11.2/openshift-client-linux-4.11.2.tar.gz
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
