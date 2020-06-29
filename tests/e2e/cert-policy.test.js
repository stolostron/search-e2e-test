/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************
 /* Copyright (c) 2020 Red Hat, Inc. */
const fs = require('fs')
const path = require('path')

let page

module.exports = {
  '@disabled': true,

  before: (browser) => {
    const loginPage = browser.page.LoginPage()
    loginPage.navigate()
    loginPage.authenticate()

    page = browser.page.ConfigPolicyController()
  },

  'Cert policy: create issuer and certificate ': (browser) => {
    const time = browser.globals.time
    const testIssuer = fs.readFileSync(path.join(__dirname, 'yaml/cert_policy/create_test_issuer.yaml'))
    let yaml = testIssuer.toString()
    page.createPolicy(browser, 'policy-create-issuer-' + time, yaml, time)
    browser.pause(20000) // Wait for policy to create issuer 20s
    page.checkViolations('policy-create-issuer-' + time, false)
    browser.pause(1000)

    const testCertificate = fs.readFileSync(path.join(__dirname, 'yaml/cert_policy/create_test_certificate.yaml'))
    yaml = testCertificate.toString()
    page.createPolicy(browser, 'policy-create-certificate-' + time, yaml, time)
    browser.pause(20000) // Wait for policy to create certificate 20s
    page.checkViolations('policy-create-certificate-' + time, false)
    page.deletePolicy('policy-create-certificate-' + time)
  },

  'Cert policy: create cert policy and should show violation': (browser) => {
    const time = browser.globals.time
    const certPolicy = fs.readFileSync(path.join(__dirname, 'yaml/cert_policy/create_test_certpolicy.yaml'))
    const yaml = certPolicy.toString()
    page.createPolicy(browser, 'policy-certificatepolicy-' + time, yaml, time)
    browser.pause(40000) // Wait for cert policy to detect violation 30s
    page.checkViolations('policy-certificatepolicy-' + time, true)
  },

  'Cert policy: update certificate and secret': (browser) => {
    const time = browser.globals.time
    const updateCertificate = fs.readFileSync(path.join(__dirname, 'yaml/cert_policy/update_test_certificate.yaml'))
    const yaml = updateCertificate.toString()
    page.createPolicy(browser, 'policy-update-certificate-' + time, yaml, time)
    browser.pause(40000) // Wait for policy to update certificate 30s
    page.checkViolations('policy-update-certificate-' + time, false)
    page.deletePolicy('policy-update-certificate-' + time)
  },

  'Cert policy: cert policy should show compliant': (browser) => {
    const time = browser.globals.time
    // page.searchPolicy('policy-certificatepolicy-' + time, true)
    // browser.pause(20000) // Wait for cert policy to detect compliant 60s
    page.checkViolations('policy-certificatepolicy-' + time, false)
  },

  'Cert policy: clean up': (browser) => {
    const time = browser.globals.time
    page.deletePolicy('policy-create-issuer-' + time)
    page.deletePolicy('policy-certificatepolicy-' + time)

    const deleteAll = fs.readFileSync(path.join(__dirname, 'yaml/cert_policy/delete_test_all.yaml'))
    const yaml = deleteAll.toString()
    page.createPolicy(browser, 'policy-delete-all-' + time, yaml, time)
    browser.pause(20000) // Wait for policy to delete
    page.checkViolations('policy-delete-all-' + time, false)
    page.deletePolicy('policy-delete-all-' + time)

    // page.searchPolicy('policy-create-issuer-' + time, false)
    // page.searchPolicy('policy-create-certificate-' + time, false)
    // page.searchPolicy('policy-certificatepolicy-' + time, false)
    // page.searchPolicy('policy-update-certificate-' + time, false)
    // page.searchPolicy('policy-delete-certificate-' + time, false)
    // page.searchPolicy('policy-delete-secret-' + time, false)
    // page.searchPolicy('policy-delete-issuer-' + time, false)
  },
}
