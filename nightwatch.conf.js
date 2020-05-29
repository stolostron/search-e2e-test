/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 * Copyright (c) 2020 Red Hat, Inc
 *******************************************************************************/
var config = require("./config");

module.exports = (settings => {
  const baseDomain = config.get('options:hub:baseDomain')
  var defaultUrl = `https://multicloud-console.apps.${baseDomain}:${config.get('CLUSTER_PORT')}`
  settings.test_settings.default.launch_url = defaultUrl
  return settings

})(require('./nightwatch.json'))
