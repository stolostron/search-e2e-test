/**
 * Copyright (c) 2020 Red Hat, Inc.
 */

import { page as loginPage } from '../page-objects/LoginPage'
import { page as searchPage } from '../page-objects/SearchPage'

/* before(() => {
  loginPage.commands.navigate()
  loginPage.commands.authenticate('kube:admin', Cypress.env('user'), Cypress.env('password'))
  
  const url = `${Cypress.env('subBaseUrl')}/multicloud/search`
  searchPage.commands.navigate(url)
}) */

/* describe('Search: Functional Tests', () => {
  it('Search: Load page as admin user', () =>{
    verifyPageContent()
  })

  it('Search: Search for secret as admin user', () => {
    focusInput()
    enterTextInSearchbar('kind', ' ', 'secret')
    enterTextInSearchbar('name', ' ', 'my-test-secret')
    checkTagArray('kind:secret')
  })

  it('Search: Edit secret as admin user', () => {

  })
}) */

/* module.exports = {
  '@disabled': false,
  before: function (browser) {
    const loginPage = browser.page.LoginPage()
    loginPage.navigate()
    loginPage.authenticate('search-e2e', config.get('CLUSTER_VIEWER_USR'), config.get('CLUSTER_VIEWER_PWD'))

    const url = `${browser.launch_url}${config.get('contextPath')}/search`
    searchPage = browser.page.SearchPage()
    searchPage.navigate(url)
  },

  'Search: Load page as viewer': () => {
    searchPage.verifyPageContent()
  },

  // 'Search: Viewer is NOT able to view secrets': (browser) => {
  //   searchPage.focusInput()
  //   searchPage.enterTextInSearchbar(browser, 'kind', '', 'secret')
  //   searchPage.checkTagArray('kind:secret')
  //   //TODO
  //   searchPage.verifyNoResults()
  // },

  'Search: Viewer is not allowed to edit configmap': (browser) => {
    searchPage.focusInput()
    searchPage.enterTextInSearchbar(browser, 'kind', '', 'configmap')
    searchPage.enterTextInSearchbar(browser, 'name', '', 'my-test-config')
    searchPage.checkTagArray('kind:configmap')
    searchPage.checkSpecificSearchFilter(2, 'name:my-test-config')
    searchPage.verifySearchResult(1, 'my-test-config')
    // TODO
    searchPage.checkAccess()
  },

  after: function (browser, done) {
    setTimeout(() => {
      browser.end()
      done()
    })
  }
} */
