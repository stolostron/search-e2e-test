/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 * * Copyright (c) 2020 Red Hat, Inc.
 *******************************************************************************/

const config = require('../../config')

let searchPage

module.exports = {
  '@disabled': false,
  before: function (browser) {
    const loginPage = browser.page.LoginPage()
    loginPage.navigate()
    loginPage.authenticate('kube:admin', config.get('options:hub:user'), config.get('options:hub:password'))

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
    searchPage.verifySaveBtnTxt(browser, 'Save')
    searchPage.save(browser)
  },

  after: function (browser, done) {
    setTimeout(() => {
      browser.end()
      done()
    })
  }
}
