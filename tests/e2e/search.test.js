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

  // 'Search: Search for pods': (browser) => {
  //   searchPage.focusInput()
  //   searchPage.enterTextInSearchbar(browser, 'kind', '', 'pod')
  //   searchPage.checkTagArray('kind:pod')
  //   searchPage.resetInput()
  // },


  after: function (browser, done) {
    setTimeout(() => {
      browser.end()
      done()
    })
  }
}
