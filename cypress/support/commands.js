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
const config = require('../config')

Cypress.Commands.add('login', (username, password) => {

})

 Cypress.Commands.add('getKubeToken',() => {
  let kubeToken = ''
  try {
    cy.exec(`oc login -u ${Cypress.env('user')} -p ${Cypress.env('password')} --server=https://api.${Cypress.env('baseDomain')}:6443 --insecure-skip-tls-verify=true`)
     .then(() => {
       cy.exec('oc whoami -t').then((res) => {
        process.env.SERVICEACCT_TOKEN = res.stdout
        kubeToken = res.stdout
        console.log('kubeToken', kubeToken)
        return kubeToken
      })
     })
  } catch (e){
    console.error('Error getting kube token. ', e);
    return kubeToken
  }
})

Cypress.Commands.add('kubeRequest', (path, method, jsonBody, kubeToken) => {
  return axios({
    url: `https://api.${config.get('options:hub:baseDomain')}:6443${path}`,
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

Cypress.Commands.add('sleep', (milliseconds) => {
  const data = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds )
})

