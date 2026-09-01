#!/bin/bash
# Copyright Contributors to the Open Cluster Management project

# Exit if command fails
set -e 

mkdir clis-unpacked

# Install curl and htpasswd utility
if command -v apt-get >/dev/null 2>&1; then
  apt-get update
  apt-get install -y curl apache2-utils
elif command -v microdnf >/dev/null 2>&1; then
  microdnf install -y tar gzip httpd-tools
  microdnf clean all
elif command -v dnf >/dev/null 2>&1; then
  dnf install -y tar gzip httpd-tools
  dnf clean all
else
  echo 'Error: no supported package manager found (apt-get, microdnf, dnf).'
  exit 1
fi

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

echo 'htpasswd utilities install completed.'
