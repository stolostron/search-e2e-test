// Copyright Contributors to the Open Cluster Management project

const nconf = require('nconf'),
  nconfYaml = require('nconf-yaml'),
  fs = require('fs')

var optionsFile = './options.yaml'
if (fs.existsSync('./resources/options.yaml')) {
  optionsFile = './resources/options.yaml'
}

const timestamp = Date.now()

nconf.env({ lowerCase: true, separator: '_' }).file({ file: optionsFile, format: nconfYaml }).defaults({
  CLUSTER_PORT: '443',
  CLUSTER_VIEWER_USR: 'user-viewer',
  CLUSTER_VIEWER_PWD: 'pass-viewer',
  contextPath: '/multicloud',
  squadName: 'observability-usa',
  SEARCH_API_V1: false,
  timestamp,
})

// Hack to deal with camelCase when using env OPTIONS_HUB_BASEDOMAIN OPTIONS_HUB_USER OPTIONS_HUB_PASSWORD
try {
  nconf.required(['options:hub:baseDomain', 'options:hub:user', 'options:hub:password'])
} catch {
  if (process.env.OPTIONS_HUB_BASEDOMAIN || process.env.CYPRESS_OPTIONS_HUB_BASEDOMAIN) {
    nconf.set(
      'options:hub:baseDomain',
      process.env.OPTIONS_HUB_BASEDOMAIN || process.env.CYPRESS_OPTIONS_HUB_BASEDOMAIN
    )
  }

  if (process.env.OPTIONS_HUB_USER || process.env.CYPRESS_OPTIONS_HUB_USER) {
    nconf.set('options:hub:user', process.env.OPTIONS_HUB_USER || process.env.CYPRESS_OPTIONS_HUB_USER)
  }

  if (process.env.OPTIONS_HUB_PASSWORD || process.env.CYPRESS_OPTIONS_HUB_PASSWORD) {
    nconf.set('options:hub:password', process.env.OPTIONS_HUB_PASSWORD || process.env.CYPRESS_OPTIONS_HUB_PASSWORD)
  }
}

module.exports = nconf
