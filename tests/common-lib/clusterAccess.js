// Copyright (c) 2020 Red Hat, Inc.

import config from '../../config'
const { execSync } = require('child_process');


const clusterLogin = () => {
    execSync(`oc login -u ${config.get('options:hub:user')} -p ${config.get('options:hub:password')} --server=https://api.${config.get('options:hub:baseDomain')}:6443`)
}

const getToken = () => {
    return execSync('oc whoami -t').toString().replace('\n', '')
}


export { clusterLogin, getToken }