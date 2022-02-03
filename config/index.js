/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2017. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 * Copyright (c) 2020 Red Hat, Inc.
 *******************************************************************************/
var nconf = require('nconf'),
  nconfYaml = require('nconf-yaml'),
  path = require('path'),
  fs = require('fs')

var configDir = path.resolve(__dirname)
var optionsFile = './options.yaml'

if (fs.existsSync('./resources/options.yaml')) {
  optionsFile = './resources/options.yaml'
}

const timeStamp = Date.now()

nconf
  .env({ lowerCase: true, separator: '_' })
  .file({ file: optionsFile, format: nconfYaml })
  .defaults({
    timestamp: timeStamp,
    CLUSTER_PORT: '443',
    CLUSTER_VIEWER_USR: 'user-viewer',
    CLUSTER_VIEWER_PWD: 'pass-viewer',
    contextPath: '/multicloud',
    squadName: 'observability-usa',
  })

// Hack to deal with camelCase when using env OPTIONS_HUB_BASEDOMAIN OPTIONS_HUB_USER OPTIONS_HUB_PASSWORD
try {
  nconf.required([
    'options:hub:baseDomain',
    'options:hub:user',
    'options:hub:password',
  ])
} catch {
  if (
    process.env.OPTIONS_HUB_BASEDOMAIN ||
    process.env.CYPRESS_OPTIONS_HUB_BASEDOMAIN
  ) {
    nconf.set(
      'options:hub:baseDomain',
      process.env.OPTIONS_HUB_BASEDOMAIN ||
        process.env.CYPRESS_OPTIONS_HUB_BASEDOMAIN
    )
  }

  if (process.env.OPTIONS_HUB_USER || process.env.CYPRESS_OPTIONS_HUB_USER) {
    nconf.set(
      'options:hub:user',
      process.env.OPTIONS_HUB_USER || process.env.CYPRESS_OPTIONS_HUB_USER
    )
  }

  if (
    process.env.OPTIONS_HUB_PASSWORD ||
    process.env.CYPRESS_OPTIONS_HUB_PASSWORD
  ) {
    nconf.set(
      'options:hub:password',
      process.env.OPTIONS_HUB_PASSWORD ||
        process.env.CYPRESS_OPTIONS_HUB_PASSWORD
    )
  }
}

if (
  !nconf.get('options:hub:baseDomain') ||
  !nconf.get('options:hub:user') ||
  !nconf.get('options:hub:password')
) {
  throw new Error(`Missing environment variables.
    The following are required to run this tests:
    - OPTIONS_HUB_BASEDOMAIN or options.hub.baseDomain in options.yaml.
    - OPTIONS_HUB_USER or options.hub.user in options.yaml.
    - OPTIONS_HUB_PASSWORD or options.hub.password in options.yaml.`)
}

module.exports = nconf
