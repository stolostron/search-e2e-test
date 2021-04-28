/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

const fs = require('fs')

/**
 * @type {Cypress.PluginConfig}
 */

const { cleanReports } = require('../scripts/helpers')

module.exports = (on, config) => {

  cleanReports()

  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config

  require('cypress-terminal-report/src/installLogsPrinter')(on)

  on('task', {
    log(message) {
      console.log(message)

      return null
    },
  })

  return config
}
