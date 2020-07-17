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
module.exports = (on, config) => {
  var data = null
  try {
    fs.readFile(`${__dirname}/../../cypress.json`, (err, res) => {
      if (err) {
        console.debug(err)
      } else {
        data = JSON.parse(res)
        console.log('Test environment')
        console.log('========================================')
        console.log(`${data.env.baseDomain ? '\033[0;32mbaseDomain\033[0m' : '\033[0;31mbaseDomain\033[0m'}  :  ${data.env.baseDomain}`)
        console.log(`${data.env.user ? '\033[0;32muser\033[0m' : '\033[0;31muser\033[0m'}  :  ${data.env.user}`)
        console.log(`${data.env.password ? '\033[0;32mpassword\033[0m' : '\033[0;31mpassword\033[0m'}  :  ${data.env.password}`)
        console.log('========================================\n')
      }
    })
  } catch (err) {
    console.debug(err)
  }
}
