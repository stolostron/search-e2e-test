/**
 * Copyright (c) 2020 Red Hat, Inc.
 */

import { page as loginPage } from '../page-objects/LoginPage'
import { page as searchPage } from '../page-objects/SearchPage'

before(() => {
  loginPage.commands.navigate()
  loginPage.commands.authenticate('kube:admin', Cypress.env('user'), Cypress.env('password'))
  
  const url = `${Cypress.env('subBaseUrl')}/multicloud/search`
  searchPage.commands.navigate(url)
})

describe('Search: Functional Tests', () => {
  it('Search: Load page as admin user', () =>{
    searchPage.commands.verifyPageContent()
  })

  it('Search: Search for secret as admin user', () => {
    searchPage.commands.focusInput()
    searchPage.commands.enterTextInSearchbar('kind', ' ', 'secret')
    searchPage.commands.enterTextInSearchbar('name', ' ', 'my-test-secret')
    searchPage.commands.checkTagArray('kind:secret')
  })

  /* it('Search: Edit secret as admin user', () => {
    searchPage.commands.navigateToResource()
    searchPage.commands.verifyEditBtnTxt(browser, 'EditEdit')
    searchPage.commands.edit()
    searchPage.commands.enterTextInYamlEditor(browser, 'test: test')
    searchPage.commands.verifySaveBtnTxt(browser, 'Save')
    searchPage.commands.save(browser)
  }) */
})

after(() => {
  setTimeout(() => {
    cy.end()
    // done()
  })
})