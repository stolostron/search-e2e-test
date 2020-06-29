/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

module.exports = {
  elements: {
    adminBtn: '#user-dropdown',
    logoutBtn: '#logout',
    makeHomepageBtn: '#make-homepage'
  },
  commands: [{
    logout,
    openAdminDropdown,
    resetHomepage,
    setHomepage
  }]
}

function openAdminDropdown() {
  this.waitForElementVisible('@adminBtn')
    .click('@adminBtn')
}

function logout() {
  this.openAdminDropdown()
  this.click('@logoutBtn')
}

function resetHomepage(browser, url) {
  browser.url(`${url}/welcome`)
  this.waitForElementVisible('@adminBtn')
    .click('@adminBtn')
  this.api.pause(1000)
  browser.element('css selector', '#make-homepage', result => {
    if(result.value === true) {
      browser.click('#make-homepage')
    }
  })
}

function setHomepage(browser, url) {
  const newHomepage = `${url}/tools/cli`
  browser.url(newHomepage)
  this.waitForElementVisible('@adminBtn')
    .click('@adminBtn')
  this.waitForElementVisible('@makeHomepageBtn')
    .click('@makeHomepageBtn')
  browser.url(url)
  this.waitForElementVisible('@adminBtn')
    .click('@adminBtn')
  this.expect.element('@makeHomepageBtn').to.not.be.present
}
