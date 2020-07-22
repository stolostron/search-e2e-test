/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */


const fs = require('fs')
const path = require('path')
const jsYaml = require('js-yaml')

exports.getConfig = () => {
  let config
  if (process.env.CYPRESS_TEST_MODE === 'e2e') {
    config = fs.readFileSync(path.join(__dirname , 'config.e2e.yaml'))
  } else {
    config = fs.readFileSync(path.join(__dirname, 'config.func.yaml'))
  }

  try {
    config = jsYaml.safeLoad(config)
  } catch (e) {
    throw new Error(e)
  }

  return JSON.stringify(config)
}




// // const fs = require('fs')
// const path = require('path')
// const nconf = require('nconf')
// const nconfYaml = require('nconf-yaml')


// const configDir = path.resolve(__dirname)
// let optionsFile = '../../options.yaml'

// // if (fs.existsSync('./resources/options.yaml')) {
// //   optionsFile = './resources/options.yaml'
// // }

// const timeStamp = Date.now()

// nconf.env({ lowerCase: true, separator: '_' })
// .file({file: optionsFile, format: nconfYaml })
// .defaults({
//     timestamp: timeStamp,
//     CLUSTER_PORT: '443',
//     CLUSTER_VIEWER_USR: 'user-viewer',
//     CLUSTER_VIEWER_PWD: 'pass-viewer',
//     contextPath: '/multicloud'
// })

// // Hack to deal with camelCase when using env OPTIONS_HUB_BASEDOMAIN
// try {
//   nconf.required(['options:hub:baseDomain'])
//   } catch {
//   if (process.env.OPTIONS_HUB_BASEDOMAIN) {
//     nconf.set('options:hub:baseDomain', process.env.OPTIONS_HUB_BASEDOMAIN)
//   }
// }

// nconf.required(['options:hub:baseDomain', 'options:hub:user', 'options:hub:password'])

// if (nconf.get('options:hub:baseDomain') === ''
//   || nconf.get('options:hub:user') === ''
//   || nconf.get('options:hub:password') === '') {

//   throw new Error(`Missing environment variables.
//   The following are required to run this tests:
//   - OPTIONS_HUB_BASEDOMAIN or options.hub.baseDomain in options.yaml.
//   - OPTIONS_HUB_USER or options.hub.user in options.yaml.
//   - OPTIONS_HUB_PASSWORD or options.hub.password in options.yaml.`)
// }

// console.log('Test environment')
// console.log('========================================')
// console.log('baseDomain : ', nconf.get('options:hub:baseDomain'))
// console.log('user       : ', nconf.get('options:hub:user'))
// // console.log('password   : ', nconf.get('options:hub:password'))
// console.log('========================================\n')

// module.exports = nconf
dss