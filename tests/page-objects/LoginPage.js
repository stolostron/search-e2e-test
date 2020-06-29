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

module.exports = {
  url: function () {
    return `${this.api.launchUrl}${config.get('contextPath')}`
  },
  elements: {
    userSelect: 'a.idp:nth-of-type(1)',
    username: '#inputUsername',
    password: '#inputPassword',
    submit: 'button[type="submit"]',
    error: '.bx--inline-notification--error',
    header: '.app-header',
    loginForm: 'form[role="form"]',
    spinner: '.content-spinner',
  },
  commands: [{
    inputUsername,
    inputPassword,
    submit,
    authenticate,
    waitForLoginSuccess,
    waitForLoginForm
  }]
}

//helper for other pages to use for authentication in before() their suit
function authenticate() {
  if(process.env.SELENIUM_USER === undefined || process.env.SELENIUM_PASSWORD === undefined){
    this.api.end()
    throw new Error('Env variable NOT set.\nPlease export UI user/password as SELENIUM_USER/SELENIUM_PASSWORD')
  }
  this.waitForLoginForm()
  this.waitForElementPresent('@username')
  this.inputUsername()
  this.inputPassword()
  this.submit()
  this.waitForLoginSuccess()
}

function inputUsername() {
  this.waitForElementPresent('@username')
    .setValue('@username', process.env.SELENIUM_USER )
}

function inputPassword() {
  this.waitForElementPresent('@password')
    .setValue('@password', process.env.SELENIUM_PASSWORD )
}

function submit() {
  this.waitForElementPresent('@submit')
    .click('@submit')
}

function waitForLoginSuccess() {
  this.waitForElementPresent('@header')
  this.waitForElementNotPresent('@spinner')
}

function waitForLoginForm() {
  const specialSelect = 'a.idp'
  this.api.elements('css selector', specialSelect, res => {
    if (res.status < 0 || res.value.length < 1) {
      // do nothing
    }
    else{
      // select kube:admin if env SELENIUM_USER_SELECT not specified
      const userSelector = `a.idp[title="Log in with ${process.env.SELENIUM_USER_SELECT || 'kube:admin'}"]`
      this.waitForElementPresent(userSelector)
      this.click(userSelector)
    }
  })
  this.waitForElementVisible('@loginForm')
}
