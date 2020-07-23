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

Cypress.Commands.add('login', (OCP_CLUSTER_USER, OCP_CLUSTER_PASS, OC_IDP) => {
  cy.visit('/multicloud/search')
  cy.get('body').then(body => {
    // Check if logged in
    if (body.find('#header').length === 0) {

      // Check if identity providers are configured
      if (body.find('form').length === 0)
        cy.contains(OC_IDP).click()
      cy.get('#inputUsername').type(OCP_CLUSTER_USER)
      cy.get('#inputPassword').type(OCP_CLUSTER_PASS)
      cy.get('button[type="submit"]').click()
      cy.get('#header').should('exist')
    }
  })
})



Cypress.Commands.add('kubeRequest', (path, method, jsonBody, kubeToken) => {
  return axios({
    url: `https://api.${Cypress.env('OPTIONS_HUB_BASEDOMAIN')}:6443${path}`,
    method,
    data: jsonBody,
    headers: {
      Authorization: `bearer ${kubeToken}`,
      'Content-Type': method !== 'patch' ? 'application/json' : 'application/json-patch+json',
      'Accept': 'application/json',
    }
  })
  .catch((err) => {
    console.log('Error at kubeRequest(): ', err.message);
    throw(err)
  })
  .then(res => res.data)
})
