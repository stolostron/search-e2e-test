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

const axios = require("axios");

Cypress.Commands.add('login', (OPTIONS_HUB_USER, OPTIONS_HUB_PASSWORD, OC_IDP) => {
  cy.visit('/multicloud/search')
  cy.get('body').then(body => {
    // Check if logged in
    if (body.find('#header').length === 0) {

      // Check if identity providers are configured
      if (body.find('form').length === 0)
        cy.contains(OC_IDP).click()
      cy.get('#inputUsername').type(OPTIONS_HUB_USER)
      cy.get('#inputPassword').type(OPTIONS_HUB_PASSWORD)
      cy.get('button[type="submit"]').click()
      cy.wait(6000)
      cy.get('#header', {timeout: 10000}).should('exist')
    }
  })
})
