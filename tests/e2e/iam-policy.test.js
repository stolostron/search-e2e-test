/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
/* Copyright (c) 2020 Red Hat, Inc. */

var fs = require('fs')
const path = require('path')

let page

module.exports = {
  '@disabled': false,

  before: (browser) => {
    const loginPage = browser.page.LoginPage()
    loginPage.navigate()
    loginPage.authenticate()

    page = browser.page.ConfigPolicyController()
  },

  'IAM policy: create iam-policy': (browser) => {
    const time = browser.globals.time
    const createIamPolicy = fs.readFileSync(path.join(__dirname, 'yaml/iam_policy/create_test_iam_policy.yaml'))
    var yaml = createIamPolicy.toString()
    page.createPolicy(browser, 'policy-iampolicy-' + time, yaml, time)
    browser.pause(30000) // Wait for policy to create iam-policy 20s
    page.checkViolations('policy-iampolicy-' + time, false)
  },

  'IAM policy: create clusterrolebinding as should show violation': (browser) => {
    const time = browser.globals.time
    const createCRB = fs.readFileSync(path.join(__dirname, 'yaml/iam_policy/create_test_clusterrolebinding.yaml'))
    var yaml = createCRB.toString()
    page.createPolicy(browser, 'policy-clusterrolebinding-test-' + time, yaml, time)
    browser.pause(20000) // Wait for policy to create clusterrolebinding 20s
    page.checkViolations('policy-clusterrolebinding-test-' + time, false)
    browser.pause(10000) // Wait for iam policy to detect change 60s
    page.checkViolations('policy-iampolicy-' + time, true)
    page.deletePolicy('policy-clusterrolebinding-test-' + time)
  },

  'IAM policy: delete clusterrolebinding as should show compliant': (browser) => {
    const time = browser.globals.time
    const deleteCRB = fs.readFileSync(path.join(__dirname, 'yaml/iam_policy/delete_test_clusterrolebinding.yaml'))
    var yaml = deleteCRB.toString()
    page.createPolicy(browser, 'policy-clusterrolebinding-delete-' + time, yaml, time)
    browser.pause(20000) // Wait for policy to delete clusterrolebinding 20s
    page.checkViolations('policy-clusterrolebinding-delete-' + time, false)
    browser.pause(10000) // Wait for iam policy to detect change 120s
    page.checkViolations('policy-iampolicy-' + time, false)
    page.deletePolicy('policy-clusterrolebinding-delete-' + time)
  },

  'IAM policy: clean up': (browser) => {
    const time = browser.globals.time
    page.deletePolicy('policy-iampolicy-' + time)
  },
}
