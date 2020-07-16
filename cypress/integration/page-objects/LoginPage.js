/**
 * Copyright (c) 2020 Red Hat, Inc.
 */

// import execCLI from "../../tests/utils/cliHelper"

export const page = {
  elements: {
    identityProvider43: 'a.idp',
    identityProvider44: 'a.pf-c-button',
    username: '#inputUsername',
    password: '#inputPassword',
    submit: 'button[type="submit"]',
    error: '.bx--inline-notification--error',
    header: '.app-header',
    loginPage43: '.login-pf',
    loginPage44: '.pf-c-login', 
  },
  commands: {
    authenticate,
    chooseIdentityProvider,
    inputUsername,
    inputPassword,
    navigate,
    submit,
    waitForLoginPageLoad,
    waitForLoginSuccess
  }
}

/**
 * Authenticate the user for e2e tests.
 * Helper for other pages to use for authentication in before() their suit
 */
async function authenticate(idprovider, username, password) {
  let ocpVersion = 'Server Version: 4.4.9' // await execCLI(`oc version | grep Server`)
  const parsedOCPVersion = parseFloat(ocpVersion.substring(16, 19))
  waitForLoginPageLoad(parsedOCPVersion)
  chooseIdentityProvider(parsedOCPVersion, idprovider)
  inputUsername(username)
  inputPassword(password)
  submit()
  waitForLoginSuccess()
}

/**
 * Wait for the login page to load
 */
function waitForLoginPageLoad(parsedOCPVersion) {
  parsedOCPVersion >= 4.4
  ? cy.get(page.elements.loginPage44)
  : cy.get(page.elements.loginPage43)
}

/**
 * 
 */
function chooseIdentityProvider(parsedOCPVersion, idprovider) {
  let userSelector = ''
  if (parsedOCPVersion >= 4.4) {
    cy.get(page.elements.identityProvider44)
    // This will click the id option we created in before setup.
    userSelector = `a.pf-c-button[title="Log in with ${idprovider || 'kube:admin'}"]`
  } else {
    cy.get(page.elements.identityProvider43)
    // This will click the id option we created in before setup.
    userSelector = `a.idp[title="Log in with ${idprovider || 'kube:admin'}"]`
  }
  cy.get(userSelector).click()
}

/**
 * Navigate to OpenShift web-console.
 */
function navigate() {
  cy.visit(Cypress.env('baseUrl'))
}

/**
 * Input the username on the login page.
 * @param {*} username 
 */
function inputUsername(username) {
  cy.get(page.elements.username)
    .type(username)
}

/**
 * Input the password on the login page.
 * @param {*} password 
 */
function inputPassword(password) {
  cy.get(page.elements.password)
    .type(password)
}

/**
 * Submit form data on the Login Page
 */
function submit() {
  cy.get(page.elements.submit)
    .click()
}

/**
 * Wait for the login page to succeed
 */
function waitForLoginSuccess() {
  cy.get(page.elements.header /*{ timeout: 20000 }*/)
}
