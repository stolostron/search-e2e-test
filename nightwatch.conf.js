/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************
 /* Copyright (c) 2020 Red Hat, Inc. */
const config = require('./config')


module.exports = (settings => {

  let defaultUrl = `https://localhost:${config.get('httpPort')}`
  if(process.env.SELENIUM_CLUSTER ){
    defaultUrl = process.env.SELENIUM_CLUSTER
  }
  settings.test_settings.default.launch_url = defaultUrl
  return settings

})(require('./nightwatch.json'))
