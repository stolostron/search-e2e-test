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
    searchPage.enterTextInSearchbar(browser, 'name', '', 'my-test-config')
    searchPage.checkTagArray('kind:configmap')
    searchPage.checkSpecificSearchFilter(2, 'name:my-test-config')
    searchPage.verifySearchResult(1, 'my-test-config')
    searchPage.resetInput()
  },

  'Search: Search for deployment': (browser) => {
    searchPage.focusInput()
    searchPage.enterTextInSearchbar(browser, 'kind', '', 'deployment')
    searchPage.enterTextInSearchbar(browser, 'name', '', 'my-test-deployment')
    searchPage.checkTagArray('kind:deployment')
    searchPage.checkSpecificSearchFilter(2, 'name:my-test-deployment')
    searchPage.verifySearchResult(1, 'my-test-deployment')
  },

  'Search: Delete the deployment': (browser) => {
    searchPage.deleteResult()
    searchPage.resetInput()
  },

  after: function (browser, done) {
    setTimeout(() => {
      browser.end()
      done()
    })
  }
}
