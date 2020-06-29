/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *******************************************************************************/

const config = require('../../config')
// const a11yScan = require('../utils/accessibilityScan')
let page

module.exports = {
  '@disabled': true,

  before: (browser) => {
    const loginPage = browser.page.LoginPage()
    loginPage.navigate()
    loginPage.authenticate()

    const url = `${browser.launch_url}${config.get('contextPath')}/findings`
    page = browser.page.SecurityFindingsPage()
    page.navigate(url)
  },

  'Security findings page: Load and run expand': (browser) => {
    page.verifyTable(browser)
  },

  'Security findings page: Verify summary table': (browser) => {
    page.verifySummary(browser, `${browser.launch_url}${config.get('contextPath')}/findings`)
  },

  'Security findings page: Test pagination': (browser) => {
    page.verifyPagination(browser)
  },

  'Security findings page: Run Accessibility Scan': (browser) => {
    page.navigate(`${browser.launch_url}${config.get('contextPath')}/findings`)
    // a11yScan.runAccessibilityScan(browser, 'securityFindings')
  },
}
