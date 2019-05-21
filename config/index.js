/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2017. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
var nconf = require('nconf'),
    log4js = require('log4js'),
    logger = log4js.getLogger('server'),
    path = require('path')

var configDir = path.resolve(__dirname)

process.env.NODE_ENV = process.env.NODE_ENV || 'development'
process.env.NODE_ENV = process.env.BUILD_ENV || process.env.NODE_ENV

nconf.argv().env('__')

var env = nconf.get('NODE_ENV')

logger.info(`NODE_ENV=${process.env.NODE_ENV}`)

nconf.file(env, `${configDir}/config-${env}.json`)
nconf.file('default', `${configDir}/config-defaults.json`)

module.exports = nconf
