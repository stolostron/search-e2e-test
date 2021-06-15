// Copyright (c) 2021 Red Hat, Inc.

const { execSync } = require('child_process');
const { getInstalledNamespace } = require('../common-lib/clusterAccess');

module.exports = () => {
    execSync(`oc delete route search-api-automation -n ${getInstalledNamespace()}`)
};
