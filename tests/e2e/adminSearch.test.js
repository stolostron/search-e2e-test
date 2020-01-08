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
    loginPage.authenticate(config.get('CLUSTER_ADMIN_USR'), config.get('CLUSTER_ADMIN_PWD'))

    const url = `${browser.launch_url}${config.get('contextPath')}/search`
    searchPage = browser.page.SearchPage()
    searchPage.navigate(url)
  },

  'Search: Load page': () => {
    searchPage.verifyPageContent()
  },

  'Search: Search for secret': (browser) => {
    searchPage.focusInput()
    searchPage.enterTextInSearchbar(browser, 'kind', '', 'secret')
    searchPage.enterTextInSearchbar(browser, 'name', '', 'my-test-secret')
    searchPage.checkTagArray('kind:secret')
    searchPage.checkSpecificSearchFilter(2, 'name:my-test-secret')
    searchPage.verifySearchResult(1, 'my-test-secret')
  },

  'Edit secret as Admin user': (browser) => {
    searchPage.navigateToResource()
    searchPage.verifyEditBtnTxt(browser, 'EditEdit')
    searchPage.edit()
    searchPage.enterTextInYamlEditor(browser, 'test: test')
    searchPage.edit()
    searchPage.verifyEditBtnTxt(browser, 'Save')
    searchPage.save(browser)
  },

  after: function (browser, done) {
    setTimeout(() => {
      browser.end()
      done()
    })
  }
}
