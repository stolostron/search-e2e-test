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


nconf.env({ lowerCase: true, separator: '_' })
    .file({file: optionsFile, format: nconfYaml })
    .defaults({
        httpPort: '6443',
        CLUSTER_VIEWER_USR: 'user-viewer',
        CLUSTER_VIEWER_PWD: 'pass-viewer',
        contextPath: '/multicloud'
    })

try {
    nconf.required(['options:hub:SELENIUM_CLUSTER'])
} catch {
    if (process.env.SELENIUM_CLUSTER) {
        nconf.set('options:hub:SELENIUM_CLUSTER', process.env.SELENIUM_CLUSTER)
    }
}

try {
    nconf.required(['options:hub:SELENIUM_USER'])
} catch {
    if (process.env.SELENIUM_USER) {
        nconf.set('options:hub:SELENIUM_USER', process.env.SELENIUM_USER)
    }
}

try {
    nconf.required(['options:hub:SELENIUM_PASSWORD'])
} catch {
    if (process.env.SELENIUM_PASSWORD) {
        nconf.set('options:hub:SELENIUM_PASSWORD', process.env.SELENIUM_PASSWORD)
    }
}
nconf.required(['options:hub:SELENIUM_CLUSTER', 'options:hub:SELENIUM_USER', 'options:hub:SELENIUM_PASSWORD'])

if (nconf.get('options:hub:baseDomain') === ''
    || nconf.get('options:hub:user') === ''
    || nconf.get('options:hub:password') === '') {
    
    throw new Error(`Missing environment variables.
    The following are required to run this tests:
    - SELENIUM_CLUSTER or options.hub.SELENIUM_CLUSTER in options.yaml.
    - SELENIUM_USER or options.hub.SELENIUM_USER in options.yaml.
    - SELENIUM_PASSWORD or options.hub.SELENIUM_PASSWORD in options.yaml.`)
  }

console.log('Test environment')
console.log('========================================')
console.log('SELENIUM_CLUSTER    : ', nconf.get('options:hub:SELENIUM_CLUSTER'))
console.log('SELENIUM_USER       : ', nconf.get('options:hub:SELENIUM_USER'))
console.log('SELENIUM_PASSWORD   : ', nconf.get('options:hub:SELENIUM_PASSWORD'))
console.log('========================================\n')

module.exports = nconf
