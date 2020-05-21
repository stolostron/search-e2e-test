#!/bin/bash

# check and load options.yaml
OPTIONS_FILE=/resources/options.yaml
if [ -f $OPTIONS_FILE ]; then
  export CLUSTER_HOST=`yq r $OPTIONS_FILE 'options.hub.baseDomain'`
  #export K8S_CLUSTER_MASTER_IP="https://multicloud-console.apps.$BASE_DOMAIN"
  export CLUSTER_ADMIN_USER=`yq r $OPTIONS_FILE 'options.hub.user'`
  export CLUSTER_ADMIN_PWD=`yq r $OPTIONS_FILE 'options.hub.password'`
fi


npm run test:e2e-headless
