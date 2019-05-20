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

  // 'Search: Search for clusters': (browser) => {
  //   searchPage.focusInput()
  //   searchPage.enterTextInSearchbar(browser, 'kind', '', 'cluster')
  //   searchPage.checkTagArray('kind:cluster')
  //   searchPage.resetInput()
  // },

  // 'Search: Search for cpu < 16': (browser) => {
  //   searchPage.focusInput()
  //   searchPage.enterTextInSearchbar(browser, 'cpu', '<', '16')
  //   searchPage.checkTagArray('cpu:<16')
  //   searchPage.resetInput()
  // },

  // 'Search: Search for created within last day': (browser) => {
  //   searchPage.focusInput()
  //   searchPage.enterTextInSearchbar(browser, 'created', '', 'day')
  //   searchPage.checkTagArray('created:day')
  //   searchPage.resetInput()
  // },

  // 'Search: Search for kind:cluster,application': (browser) => {
  //   searchPage.focusInput()
  //   searchPage.enterTextInSearchbar(browser, 'kind', '', 'cluster')
  //   searchPage.enterTextInSearchbar(browser, 'kind', '', 'application')
  //   searchPage.checkTagArray('kind:cluster,application')
  //   searchPage.resetInput()
  // },

  // 'Search: Search for keyword': (browser) => {
  //   searchPage.focusInput()
  //   searchPage.enterTextInSearchbar(browser, 'keyword', null, null)
  //   searchPage.checkTagArray('keyword')
  //   searchPage.resetInput()
  // },

  // 'Search: Search for namespace:!=default': (browser) => {
  //   searchPage.focusInput()
  //   searchPage.enterTextInSearchbar(browser, 'namespace', '!=', 'default')
  //   searchPage.checkTagArray('namespace:!=default')
  //   searchPage.resetInput()
  // },

  // 'Search: Save query': (browser) => {
  // TODO
  // },

  // 'Search: Delete query': (browser) => {
  // TODO
  // },

  // 'Search: Info modal is visible': (browser) => {
  // TODO
  // },

  // 'Search: Share modal': (browser) => {
  // TODO
  // },

  // 'Search: Edit modal': (browser) => {
  // TODO
  // },

  after: function (browser, done) {
    setTimeout(() => {
      browser.end()
      done()
    })
  }
}
