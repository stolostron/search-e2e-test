#!/bin/bash

# Copyright (c) 2020 Red Hat, Inc.

mkdir clis-unpacked

# Install OpenShift and Kubectl CLI.
echo "Installing oc and kubectl clis..."
curl -kLo oc.tar.gz https://mirror.openshift.com/pub/openshift-v4/clients/ocp/4.4.3/openshift-client-linux-4.4.3.tar.gz
tar -xzf oc.tar.gz -C clis-unpacked
chmod 755 ./clis-unpacked/oc
chmod 755 ./clis-unpacked/kubectl
mv ./clis-unpacked/oc /usr/local/bin/oc
mv ./clis-unpacked/kubectl /usr/local/bin/kubectl

# Install Kind CLI
echo "Installing kind cli"
curl -Lo ./clis-unpacked/kind "https://kind.sigs.k8s.io/dl/v0.8.1/kind-$(uname)-amd64"
chmod +x ./clis-unpacked/kind
mv ./clis-unpacked/kind /usr/local/bin/kind

# Install Docker CLI
echo "Installing docker cli..."
curl -kLo docker.tgz https://download.docker.com/linux/static/stable/x86_64/docker-18.06.0-ce.tgz
tar -xzf docker.tgz -C clis-unpacked
chmod 755 ./clis-unpacked/docker
mv ./clis-unpacked/docker/* /usr/local/bin/

rm -rf ./clis-unpacked ./oc.tar.gz ./docker.tgz

# oc login --server=${OCP_SERVER} -u ${OCP_CONSOLE_USR} -p ${OCP_CONSOLE_PWD} --insecure-skip-tls-verify=true

# Install helm CLI.
# curl -kLo helm-linux-amd64.tar.gz https://${CLUSTER_IP}:${CLUSTER_PORT}/api/cli/helm-linux-amd64.tar.gz
# mkdir helm-unpacked
# tar -xvzf helm-linux-amd64.tar.gz -C helm-unpacked
# chmod 755 ./helm-unpacked/*/helm
# sudo mv ./helm-unpacked/*/helm /usr/local/bin/helm
# rm -rf ./helm-unpacked ./helm-linux-amd64.tar.gz
# helm init

# Setup helm certs
# oc get secret helm-tiller-secret -n kube-system -o json | jq -r .data.crt | base64 --decode > ~/.helm/cert.pem
# oc get secret helm-tiller-secret -n kube-system -o json | jq -r .data.key | base64 --decode > ~/.helm/key.pem

# helm version --tls
echo 'set up complete'
