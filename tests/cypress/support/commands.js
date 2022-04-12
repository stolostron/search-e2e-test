/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import { getOpt } from '../scripts/utils'

import 'cypress-wait-until'

Cypress.Commands.add(
  'login',
  (OPTIONS_HUB_USER, OPTIONS_HUB_PASSWORD, OPTIONS_HUB_OC_IDP) => {
    var user = OPTIONS_HUB_USER || Cypress.env('OPTIONS_HUB_USER')
    var password = OPTIONS_HUB_PASSWORD || Cypress.env('OPTIONS_HUB_PASSWORD')
    var idp = OPTIONS_HUB_OC_IDP || Cypress.env('OPTIONS_HUB_OC_IDP')
    cy.visit('/search', { failOnStatusCode: false })
    cy.location().then(location => {
      if (!location.href.includes("oauth-openshift")) {
        // handle provider button
        cy.log("Clicking 'Log in with OpenShift' button");
        cy
          .get(".panel-login")
          .get("button")
          .click();
      }
    });
    cy.get('body').then((body) => {
      // Check if logged in
      if (body.find('#header').length === 0) {
        // Check if identity providers are configured
        if (body.find('form').length === 0) cy.contains(idp).click()
        cy.get('#inputUsername').click().focused().type(user)
        cy.get('#inputPassword').click().focused().type(password)
        cy.get('button[type="submit"]').click()
        cy.get('.pf-c-page__header', { timeout: 30000 })
      }
    })
  }
)

Cypress.Commands.add('reloadUntil', (condition, options) => {
  if (!options) {
    options = {}
  }

  let startTime = getOpt(options, 'startTime', Date.now())
  let timeout = getOpt(options, 'timeout', 30000)
  let interval = getOpt(options, 'interval', 0)
  if (Date.now() - startTime > timeout) {
    throw new Error(`command reloaduntil exeeded timeout: ${timeout}`)
  }
  condition().then((result) => {
    if (result == false) {
      cy.reload()
      if (interval > 0) {
        cy.wait(interval)
      }
      options.startTime = startTime
      cy.reloadUntil(condition, options)
    }
  })
})

Cypress.Commands.add('waitUntilContains', (selector, text, options) => {
  cy.waitUntil(() => cy.ifContains(selector, text), options)
})

Cypress.Commands.add('waitUntilNotContains', (selector, text, options) => {
  cy.waitUntil(() => cy.ifNotContains(selector, text), options)
})

Cypress.Commands.add('waitUntilAttrIs', (selector, attr, value, options) => {
  cy.waitUntil(() => cy.ifAttrIs(selector, attr, value), options)
})

Cypress.Commands.add('ifAttrIs', (selector, attr, value, action) => {
  return cy.checkCondition(
    selector,
    ($elem) => $elem && $elem.attr(attr) && $elem.attr(attr).includes(value),
    action
  )
})

Cypress.Commands.add('ifContains', (selector, text, action) => {
  return cy.checkCondition(
    selector,
    ($elem) => $elem && $elem.text().includes(text),
    action
  )
})

Cypress.Commands.add('ifNotContains', (selector, text, action) => {
  return cy.checkCondition(
    selector,
    ($elem) => !$elem || !$elem.text().includes(text),
    action
  )
})

Cypress.Commands.add('checkCondition', (selector, condition, action) => {
  return cy.get('body').then(($body) => {
    var $elem = $body.find(selector)
    var result = condition($elem)
    if (result == true && action) {
      return action($elem)
    }

    return cy.wrap(result)
  })
})

Cypress.Commands.add('forEach', (selector, action, options) => {
  var failIfNotFound = getOpt(options, 'failIfNotFound', false)
  if (failIfNotFound == true) {
    return cy.get(selector, options).each(($elem) => action($elem))
  }

  return cy.get('body').then(($body) => {
    var $elems = $body.find(selector)
    if ($elems.length > 0) {
      action($elems.get(0))
      cy.forEach(selector, action)
    }
  })
})

Cypress.Commands.add('logout', () => {
  cy.log('Attempt to logout existing user')
  cy.get(
    '.pf-c-app-launcher.pf-m-align-right.co-app-launcher.co-user-menu'
  ).then(($btn) => {
    //logout when test starts since we need to use the app idp user
    cy.log('Logging out existing user').get($btn).click()
    if (Cypress.config().baseUrl.includes('localhost')) {
      cy.contains('Logout').click().clearCookies()
    } else {
      cy.contains('Logout').click()
      cy.wait(4000)
      cy.location('pathname')
        .should('match', new RegExp('/oauth/authorize(\\?.*)?$'))
        .clearCookies()
    }
  })
})

Cypress.Commands.add('waitUsingSLA', () => {
  // Our SLO (goal) is to update within 5 seconds.  Setting the default SLA to 10 seconds to stabilize the tests.
  return cy.wait(parseInt(Cypress.env('SERVICE_SLA'), 10) || 10000)
})
