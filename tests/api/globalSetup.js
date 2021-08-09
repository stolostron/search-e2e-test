// Copyright (c) 2021 Red Hat, Inc.

const { getSearchApiRoute } = require("../common-lib/clusterAccess");

module.exports = async () => {
  await getSearchApiRoute();
  console.log("Done with global setup.");
};
