/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
/* Copyright (c) 2020 Red Hat, Inc. */

const config = require('../../config')
let page

module.exports = {
  '@disabled': false,

  before: (browser) => {
    const loginPage = browser.page.LoginPage()
    loginPage.navigate()
    loginPage.authenticate()

    page = browser.page.AllPolicyPage()
  },

  'All policy page: Add, search test policy': (browser) => {
    const time = browser.globals.time
    page.createTestPolicy(browser, time)
    page.searchPolicy(true, time)
    page.testDetailsPage(browser, `${time}-policy-test`)
  },

  'All policy page: Verify summary table': (browser) => {
    page.verifySummary(browser, `${browser.launch_url}${config.get('contextPath')}/all`)
  },

  'All policy page: Test pagination': (browser) => {
    page.verifyPagination(browser)
  },

  'All policy page: Delete test policy': (browser) => {
    const time = browser.globals.time
    page.deletePolicy(`${time}-policy-test`, browser)
  },
}
