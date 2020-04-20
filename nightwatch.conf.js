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
  const clusterHost = config.get('CLUSTER_HOST')
  if (clusterHost == ''){
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.error('CLUSTER_HOST is a required env variable, but got empty or undefined.')
    console.error('Exiting tests...')
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n')
    process.exit(1)
  }
  var defaultUrl = `https://multicloud-console.apps.${clusterHost}:${config.get('CLUSTER_PORT')}`
  settings.test_settings.default.launch_url = defaultUrl
  return settings

})(require('./nightwatch.json'))
