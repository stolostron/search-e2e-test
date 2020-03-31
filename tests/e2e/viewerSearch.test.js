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
  '@disabled': true,
  before: function (browser) {
    const loginPage = browser.page.LoginPage()
    loginPage.navigate()
    loginPage.authenticate(config.get('CLUSTER_VIEWER_USR'), config.get('CLUSTER_VIEWER_PWD'))

    const url = `${browser.launch_url}${config.get('contextPath')}/search`
    searchPage = browser.page.SearchPage()
    searchPage.navigate(url)
  },

  'Search: Load page': () => {
    searchPage.verifyPageContent()
  },

  // 'Search: Viewer is NOT able to view secrets': (browser) => {
  //   searchPage.focusInput()
  //   searchPage.enterTextInSearchbar(browser, 'kind', '', 'secret')
  //   searchPage.checkTagArray('kind:secret')
  //   //TODO
  //   searchPage.verifyNoResults()
  // },

  'Search: Viewer is NOT able to edit configmaps': (browser) => {
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
}
