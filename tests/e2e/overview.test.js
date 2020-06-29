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
// const a11yScan = require('../utils/accessibilityScan')
let page

module.exports = {
  '@disabled': true,

  before: (browser) => {
    const loginPage = browser.page.LoginPage()
    loginPage.navigate()
    loginPage.authenticate()

    const url = `${browser.launch_url}${config.get('contextPath')}`
    page = browser.page.OverviewPage()
    page.navigate(url)
  },

  'Overview: Load page': () => {
    page.verifyPageLoaded()
  },

  'Overview: Recent activity': (browser) => {
    page.verifyRecentActivity(browser)
  },

  'Overview: Violation table': () => {
    page.verifyViolationTable()
  },

  'Overview: Most impacted controls table': () => {
    page.verifyMostImpactedControls()
  },

  'Overview: policy summary table': () => {
    page.verifyPolicySummary()
  },

  'Overview: Run accessibility scan': () => {
    // a11yScan.runAccessibilityScan(browser, 'overview')
  },
}
