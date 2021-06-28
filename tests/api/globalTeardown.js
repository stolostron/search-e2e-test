// Copyright (c) 2021 Red Hat, Inc.

const { execSync } = require('child_process');

module.exports = () => {
    const namespace = execSync(`oc get mch -A -o jsonpath='{.items[0].metadata.namespace}'`).toString()
    execSync(`oc delete route search-api-automation -n ${namespace} --ignore-not-found`)
};
