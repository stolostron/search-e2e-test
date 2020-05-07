/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.

const config = require('../../config')
const execCLI = require('../utils/cliHelper')

module.exports = {
  url: function () {
    return `${this.api.launchUrl}${config.get('contextPath')}`
  },
  elements: {
    identityProvider43: 'a.idp',
    identityProvider44: 'a.pf-c-button',
    username: '#inputUsername',
    password: '#inputPassword',
    submit: 'button[type="submit"]',
    error: '.bx--inline-notification--error',
    header: '.app-header',
    loginPage43: '.login-pf',
    loginPage44: '.pf-c-login'
  },
  commands: [{
    waitForLoginPageLoad,
    chooseIdentityProvider,
    inputUsername,
    inputPassword,
    submit,
    authenticate,
    waitForLoginSuccess
  }]
}

//helper for other pages to use for authentication in before() their suit
async function authenticate(idprovider, username, password) {
  let ocpVersion = await execCLI(`oc version | grep Server`)
  const parsedOCPVersion = parseFloat(ocpVersion.substring(16, 19))
  this.waitForLoginPageLoad(parsedOCPVersion)
  this.chooseIdentityProvider(parsedOCPVersion, idprovider)
  this.inputUsername(username)
  this.inputPassword(password)
  this.submit()
  this.waitForLoginSuccess()
}

function waitForLoginPageLoad(parsedOCPVersion) {
  parsedOCPVersion >= 4.4
    ? this.waitForElementPresent('@loginPage44')
    : this.waitForElementPresent('@loginPage43')
}

function chooseIdentityProvider(parsedOCPVersion, idprovider) {
  let userSelector = ''
  if (parsedOCPVersion >= 4.4) {
    this.waitForElementPresent('@identityProvider44')
    // This will click the id option we created in before setup.
    userSelector = `a.pf-c-button[title="Log in with ${idprovider || 'kube:admin'}"]`
  } else {
    this.waitForElementPresent('@identityProvider43')
    // This will click the id option we created in before setup.
    userSelector = `a.idp[title="Log in with ${idprovider || 'kube:admin'}"]`
  }
  this.click(userSelector)
}

function inputUsername(username) {
  this.waitForElementVisible('@username')
    .setValue('@username', username || config.get('CLUSTER_ADMIN_USR'))
}

function inputPassword(password) {
  this.waitForElementVisible('@password')
    .setValue('@password', password || config.get('CLUSTER_ADMIN_PWD'))
}

function submit() {
  this.waitForElementVisible('@submit')
    .click('@submit')
}

function waitForLoginSuccess() {
  this.waitForElementVisible('@header', 20000)
}
