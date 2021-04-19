/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import './commands'
require('cypress-terminal-report/src/installLogsCollector')()

process.env.NODE_TLS_REJECT_UNAUTHORIZED='0'
var timeoutID

const err = 'Test taking too long! It has been running for 5 minutes.'

before(() => {
  cy.log('Executing command... oc set env deploy search-operator DEPLOY_REDISGRAPH="true" -n open-cluster-management')
  // This is needed for search to deploy RedisGraph upstream. Without this search won't be operational.
  cy.exec('oc set env deploy search-operator DEPLOY_REDISGRAPH="true" -n open-cluster-management')
  cy.clearCookies()
  cy.login()
})

beforeEach(() => {
  Cypress.Cookies.preserveOnce('acm-access-token-cookie', '_oauth_proxy', 'XSRF-TOKEN', '_csrf')
  timeoutID = setTimeout(() => {
    console.error(err)
    throw Error(err)
  }, 60000 * 5)
})

after(() => {
  cy.logout()
})

afterEach(() => {
  clearTimeout(timeoutID)
})
