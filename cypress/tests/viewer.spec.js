/**
 * Copyright (c) 2020 Red Hat, Inc.
 */

let ocpVersion = null
let parsedOCPVersion = null

describe('Authenticate User', () => {
  it('should get OCP version number', () => {
    cy.exec(`oc version | grep Server`).then((res) => {
      ocpVersion = res.stdout
      parsedOCPVersion = parseFloat(ocpVersion.substring(16, 19))
      cy.log(`OCP Version: ${parsedOCPVersion}`)
    })
  })

  it('should navigate to Openshift web-console login', () =>  {
    cy.visit(Cypress.env('baseUrl'))

    it('should wait for login page to load', () => {
      parsedOCPVersion >= 4.4
      ? cy.get('.pf-c-login')
      : cy.get('.login-pf')
    })
  })
})