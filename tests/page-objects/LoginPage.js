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

module.exports = {
  url: function () {
    return `${this.api.launchUrl}${config.get('contextPath')}`
  },
  elements: {
    // identityProvider: 'a.idp',
    username: '#inputUsername',
    password: '#inputPassword',
    submit: '.btn-lg',
    error: '.bx--inline-notification--error',
    header: '.app-header',
    loginPage: '.login-pf'
  },
  commands: [{
    inputUsername,
    inputPassword,
    submit,
    authenticate,
    waitForLoginSuccess,
    waitForLoginPageLoad
  }]
}

//helper for other pages to use for authentication in before() their suit
function authenticate(username, password) {
  this.waitForLoginPageLoad()
  // this.click('@identityProvider');
  this.inputUsername(username)
  this.inputPassword(password)
  this.submit()
  this.waitForLoginSuccess()
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

function waitForLoginPageLoad() {
  this.waitForElementPresent('@loginPage')
}
