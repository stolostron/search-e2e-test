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
import { searchPage } from '../views/search'

var apiUrl =
  Cypress.config().baseUrl.replace("multicloud-console.apps", "api") + ":6443";

Cypress.Commands.add('login', (OPTIONS_HUB_USER, OPTIONS_HUB_PASSWORD, OC_IDP) => {
  var user = OPTIONS_HUB_USER || Cypress.env('OPTIONS_HUB_USER');
  var password = OPTIONS_HUB_PASSWORD || Cypress.env('OPTIONS_HUB_PASSWORD');
  var idp = OC_IDP || Cypress.env('OC_IDP');
  searchPage.whenGoToSearchPage()
  cy.get('body').then(body => {
    // Check if logged in
    if (body.find('#header').length === 0) {

      // Check if identity providers are configured
      if (body.find('form').length === 0)
        cy.contains(idp).click()
      cy.get('#inputUsername', { timeout: 20000 }).click().focused().type(user)
      cy.get('#inputPassword', { timeout: 20000 }).click().focused().type(password)
      cy.get('button[type="submit"]', { timeout: 20000 }).click()
      searchPage.shouldPageBeReady()
      cy.get('#header', { timeout: 30000 }).should('exist')
    }
  })
})

Cypress.Commands.add('reloadUntil', (condition, options) => {
  if (!options) {
    options = {}
  }

  var startTime = getOpt(options, 'startTime', new Date())
  var timeout = getOpt(options, 'timeout', 300000)
  var interval = getOpt(options, 'interval', 0)
  var currentTime = new Date()
  if (currentTime - startTime < timeout) {
    condition().then(result => {
      if (result == false) {
        cy.reload()
        if (interval > 0) {
          cy.wait(interval)
        }

        options.startTime = startTime
        cy.reloadUntil(condition, options)
      }
    })
  }
})

Cypress.Commands.add('waitUntilContains', (selector, text, options) => {
  cy.waitUntil(() => cy.ifContains(selector, text), options);
})

Cypress.Commands.add('waitUntilNotContains', (selector, text, options) => {
  cy.waitUntil(() => cy.ifNotContains(selector, text), options);
})

Cypress.Commands.add('waitUntilAttrIs', (selector, attr, value, options) => {
  cy.waitUntil(() => cy.ifAttrIs(selector, attr, value), options);
})

Cypress.Commands.add('ifAttrIs', (selector, attr, value, action) => {
  return cy.checkCondition(selector, ($elem) => $elem && $elem.attr(attr) && $elem.attr(attr).includes(value), action)
})

Cypress.Commands.add('ifContains', (selector, text, action) => {
  return cy.checkCondition(selector, ($elem) => $elem && $elem.text().includes(text), action)
})

Cypress.Commands.add('ifNotContains', (selector, text, action) => {
  return cy.checkCondition(selector, ($elem) => !$elem || !$elem.text().includes(text), action)
})

Cypress.Commands.add('checkCondition', (selector, condition, action) => {
  return cy.get('body').then($body => {
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
  });
})

Cypress.Commands.add('logout', () => {
  cy.get('#acm-user-dropdown').click().then(() => cy.get('#acm-logout').click().then(() => cy.url().should('include', '/oauth/authorize?')))
})

Cypress.Commands.add('generateNamespace', () => {
  return 'search-' + Date.now();
})

Cypress.Commands.add('waitUsingSLA', () => {
  return cy.wait(parseInt(Cypress.env('SERVICE_SLA'), 10) || 5000)
})

Cypress.Commands.add('consolePublic', token => {
  cy.request({
    url: apiUrl + "/api/v1/namespaces/openshift-config-managed/configmaps/console-public",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      Accept: "application/json"
    }
  }).then(resp => {
    return cy.wrap(resp.body['data']['consoleURL'])
  })
})

Cypress.Commands.add('version', () => {
  cy.request({
    url: Cypress.config().baseUrl + "/multicloud/header/version"
  }).then(resp => {
    return cy.wrap(resp.body['status']['currentVersion'])
  })
})

Cypress.Commands.add('oauthEndpoint', () => {
  cy.request({
    url: apiUrl + "/.well-known/oauth-authorization-server"
  }).then(resp => {
    return cy.wrap(resp.body['token_endpoint'])
  })
})