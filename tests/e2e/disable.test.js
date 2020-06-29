/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************
* Copyright (c) 2020 Red Hat, Inc. */

var fs = require('fs')
const path = require('path')

let page

module.exports = {
  '@disabled': false,

  before: (browser) => {
    const loginPage = browser.page.LoginPage()
    loginPage.navigate()
    loginPage.authenticate()

    page = browser.page.DisablePage()
  },

  'Disable policy: test policy disable + enable': (browser) => {
    const time = browser.globals.time

    const enforce = fs.readFileSync(path.join(__dirname, 'yaml/disable_test/ed_pod_mustnothave.yaml'))
    var yaml = enforce.toString()
    page.createPolicy(browser, yaml, time)
    const inform = fs.readFileSync(path.join(__dirname, 'yaml/disable_test/ed_pod_mustnothave_inform.yaml'))
    yaml = inform.toString()
    page.createPolicy(browser, yaml, time)
    browser.pause(20000)
    page.checkViolations('policy-pod-inform-' + time, false)

    page.tryDisable('policy-pod-' + time)
    browser.pause(5000)
    const createPod = fs.readFileSync(path.join(__dirname, 'yaml/disable_test/ed_pod_create.yaml'))
    yaml = createPod.toString()
    page.createPolicy(browser, yaml, time)
    browser.pause(30000) //Wait for pod to be created
    page.checkViolations('policy-pod-create-' + time, false)
    page.checkViolations('policy-pod-inform-' + time, true)

    page.deletePolicy('policy-pod-create-' + time)
    page.tryEnable('policy-pod-' + time)
    browser.pause(30000) //Wait for pod to be deleted
    page.checkViolations('policy-pod-' + time, false)
    page.checkViolations('policy-pod-inform-' + time, false)

    page.deletePolicy('policy-pod-inform-' + time)
    page.deletePolicy('policy-pod-' + time)
  },
}
