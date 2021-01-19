// Copyright (c) 2021 Red Hat, Inc.

const { execSync } = require('child_process');

module.exports = () => {
    execSync(`oc delete route search-api-automation -n open-cluster-management`)
};