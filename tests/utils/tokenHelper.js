// Copyright (c) 2020 Red Hat, Inc.

const config = require('../../config');
const execCLI = require('./cliHelper');

const getKubeToken = async () => {
  let kubetoken = ''
  try {
    const ocVersion = await execCLI('oc version');
    console.log('oc version:\n', ocVersion);
    await execCLI(`oc login -u ${config.get('CLUSTER_ADMIN_USR')} -p ${config.get('CLUSTER_ADMIN_PWD')} --server=https://api.${config.get('CLUSTER_HOST')}:6443 --insecure-skip-tls-verify=true`);
    kubeToken = await execCLI('oc whoami -t');
  } catch (e){
    console.error('Error getting kube token. ', e);
  }
  return kubeToken;
}

module.exports = getKubeToken;