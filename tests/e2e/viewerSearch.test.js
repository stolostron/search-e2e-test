/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

const config = require('../../config')

const timestamp = config.get('timestamp')
let searchPage

module.exports = {
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
    searchPage.enterTextInSearchbar(browser, 'name', '', `my-test-config-${timestamp}`)
    searchPage.checkTagArray('kind:configmap')
    searchPage.checkSpecificSearchFilter(2, `name:my-test-config-${timestamp}`)
    searchPage.verifySearchResult(1, `my-test-config-${timestamp}`)
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
