#!/bin/bash
# Copyright (c) 2021 Red Hat, Inc.
# Copyright Contributors to the Open Cluster Management project



# Description:
#     Sets up cluster users and resources for RBAC tests
# From the search-e2e-test project directory, invoke as:
#     ./build/rbac-setup.sh
#    

set -e
DIR="$( find $HOME -type d -name "search-e2e-test" )"
RBAC_DIR=$DIR/tests/config/rbac_yaml
if [ ! -d ${RBAC_DIR} ]; then
  echo "Error: Directory ${RBAC_DIR} does not exist. Not creating RBAC resources."
  exit 1
fi

if [ -z ${OPTIONS_HUB_PASSWORD} ]; then
  echo "Error: RBAC password not set in variable OPTIONS_HUB_PASSWORD."
  exit 1
fi

if ! which htpasswd &>/dev/null; then
  if which apt-get &>/dev/null; then
    sudo apt-get update
    sudo apt-get install -y apache2-utils
  else
    echo "Error: Package manager apt-get not found. Failed to find or install htpasswd."
    exit 1
  fi
fi

touch ${RBAC_DIR}/htpasswd
for access in cluster ns; do
  for role in cluster-admin admin edit view group; do
    htpasswd -b ${RBAC_DIR}/htpasswd search-e2e-${role}-${access} ${OPTIONS_HUB_PASSWORD}
  done
done
oc create secret generic search-e2e-users --from-file=htpasswd=${RBAC_DIR}/htpasswd -n openshift-config || true
rm ${RBAC_DIR}/htpasswd
if [[ -z "$(oc -n openshift-config get oauth cluster -o jsonpath='{.spec.identityProviders}')" ]]; then
  oc patch -n openshift-config oauth cluster --type json --patch '[{"op":"add","path":"/spec/identityProviders","value":[]}]'
fi
if [ ! $(oc -n openshift-config get oauth cluster -o jsonpath='{.spec.identityProviders[*].name}' | grep -o 'search-e2e-htpasswd') ]; then
  oc patch -n openshift-config oauth cluster --type json --patch "$(cat ${RBAC_DIR}/search-e2e-rbac-auth.json)"
fi
oc apply --validate=false -k ${RBAC_DIR}
