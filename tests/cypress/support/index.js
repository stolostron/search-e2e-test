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
  // This is needed for search to deploy RedisGraph upstream. Without this search won't be operational.
  cy.exec('oc get pod -n open-cluster-management | grep search-redisgraph-0 | grep Running', {failOnNonZeroExit: false}).then(result => {
    if (result.code == 0){
      cy.task('log', 'Redisgraph pod is running.')
    } else {
      cy.task('log', 'RedisGraph not found, deploying and waiting 60 seconds for the search-redisgraph-0 pod.')
      cy.exec('oc set env deploy search-operator DEPLOY_REDISGRAPH="true" -n open-cluster-management')
      return cy.wait(10*1000)
    }
  })

  // cy.task('log', 'Executing command... oc set env deploy search-operator DEPLOY_REDISGRAPH="true" -n open-cluster-management')
  // cy.exec('oc set env deploy search-operator DEPLOY_REDISGRAPH="true" -n open-cluster-management')
  // // Wait until Redisgraph is running.
  // cy.exec('oc get pod -n open-cluster-management | grep search-redisgraph-0', {failOnNonZeroExit: false}).then(result => {
  //   if (!result.stdout.includes('Running')){
  //     cy.task('log', 'Redisgraph pod not running. Waiting 60 seconds.')
  //     return cy.wait(60*1000)
  //   }
  // })
  cy.task('log', 'continuing with before. clearCookies()')
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
