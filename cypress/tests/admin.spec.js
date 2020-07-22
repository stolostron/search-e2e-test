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
  })

  it('should wait for login page to load', () => {
    parsedOCPVersion >= 4.4
    ? cy.get('.pf-c-login')
    : cy.get('.login-pf')
  })

  it('should choose identity provider', () => {
    let userSelector = ''
  
    // This will click the id option we created in before setup.
    if (parsedOCPVersion >= 4.4) {
      cy.get('a.pf-c-button')
      userSelector = `a.pf-c-button[title="Log in with kube:admin"]`
    } else {
      cy.get('a.idp')
      userSelector = `a.idp[title="Log in with kube:admin"]`
    }
    cy.get(userSelector).click()
  })

  it(`should input username: ${Cypress.env('user')} & password: ${Cypress.env('password')}`, () => {
    cy.get('#inputUsername')
    .type(Cypress.env('user'))

    cy.get('#inputPassword')
    .type(Cypress.env('password'))

    cy.get('button[type="submit"]').click()

    parsedOCPVersion >= 4.4
    ? cy.get('header.app-header', { timeout: 20000 })
    : cy.get('header.pf-c-page__header', { timeout: 20000 })
  })
})