/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

const config = require('../../config')

let searchPage

module.exports = {
  '@disabled': false,
  before: function (browser) {
    const loginPage = browser.page.LoginPage()
    loginPage.navigate()
    loginPage.authenticate()

    const url = `${browser.launch_url}${config.get('contextPath')}/search`
    searchPage = browser.page.SearchPage()
    searchPage.navigate(url)
  },

  'Search: Load page': () => {
    searchPage.verifyPageContent()
  },

  'Search: Search for configmaps': (browser) => {
    searchPage.focusInput()
    searchPage.enterTextInSearchbar(browser, 'kind', '', 'configmap')
    browser.pause(1000)
    searchPage.enterTextInSearchbar(browser, 'name', '', 'my-test-config')
    browser.pause(1000)
    searchPage.checkTagArray('kind:configmap')
    searchPage.checkSpecificSearchFilter(2, 'name:my-test-config')
    searchPage.verifySearchResult(1, 'my-test-config')
    searchPage.resetInput()
  },

  'Search: Search for deployments': (browser) => {
    searchPage.focusInput()
    searchPage.enterTextInSearchbar(browser, 'kind', '', 'deployment')
    browser.pause(1000)
    searchPage.enterTextInSearchbar(browser, 'name', '', 'my-test-deployment')
    browser.pause(1000)
    searchPage.checkTagArray('kind:deployment')
    searchPage.checkSpecificSearchFilter(2, 'name:my-test-deployment')
    searchPage.verifySearchResult(1, 'my-test-deployment')
    searchPage.deleteResult()
    browser.pause(2000)
    searchPage.resetInput()
  },

  after: function (browser, done) {
    setTimeout(() => {
      browser.end()
      done()
    })
  }
}
