#!/bin/bash
# Copyright (c) 2021 Red Hat, Inc.
# Copyright Contributors to the Open Cluster Management project



# From the grc-ui project directory, invoke as:
#     ./build/rbac-clean.sh

RBAC_DIR=${1:-.}/tests/config/rbac_yaml

if [ ! -d ${RBAC_DIR} ]; then
  echo "Error: Directory ${RBAC_DIR} does not exist."
  exit 1
fi

for access in cluster ns; do
  for role in cluster-admin admin edit view group; do
    oc delete user search-e2e-${role}-${access}
    oc delete identity search-e2e-htpasswd:search-e2e-${role}-${access}
  done
done
oc delete -n openshift-config secret search-e2e-users || true
IDPROVIDERS=($(oc get oauth cluster -o jsonpath='{.spec.identityProviders[*].name}'))
for index in ${!IDPROVIDERS[@]}; do
  if [ ${IDPROVIDERS[${index}]} == "search-e2e-htpasswd" ]; then
    oc patch -n openshift-config oauth cluster --type json -p '[{"op": "remove","path": "/spec/identityProviders/'${index}'"}]'
  fi
done
oc delete -k ${RBAC_DIR} || true
