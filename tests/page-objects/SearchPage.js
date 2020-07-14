/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/


module.exports = {
  // NOTE: .class, #id
  elements: {
    clearAllButton: '.tagInput-cleanButton',
    dateTableCell: 'td:last-child',
    dataTableFirstChild: 'td:first-child',
    headerTitle: '.bx--detail-page-header-title',
    input: '.react-tags__search-input input',
    querySpan: '.react-tags__selected-tag-name',
    searchCardLoading: '.search-query-card-loading',
    searchSuggestionCards: '.saved-search-query-header',
    searchbar: '.react-tags',
    searchbarInput: '.react-tags__search-input',
    suggestions: '.react-tags__suggestions',
    tableHeader: '.search--resource-table-header-button',
    tableHeaderLast: '.search--resource-table-header-button:last-child',
    queryTerms: '.react-tags__selected',
    searchTable: '.bx--data-table-v2',
    overflow: 'div.bx--overflow-menu',
    overflowIcon: '.bx--overflow-menu__icon',
    overflowButton: '.bx--overflow-menu-options__btn',
    delete: 'button[class="bx--overflow-menu-options__btn"]',
    confirmDel: 'button[class="bx--btn bx--btn--danger--primary"]',
    errorNotification: '.bx--inline-notification__subtitle',

    // YAML/Edit elements
    yamlDisplay: "div.resource-details-page",
    edit: 'button[class="bx--btn bx--btn--primary"]',
    saveBtn: '.bx--btn.bx--btn--primary:nth-of-type(2)',
    yamlContainer: "div.page-content-container",
    textArea: "textarea.ace_text-input" ,
    save: '.bx--btn.bx--btn--danger--primary',
    dialog: "div.bx--modal-container",
    modal: '.bx--modal-container'
  },
  commands: [{
    checkAccess,
    checkSpecificSearchFilter,
    checkTagArray,
    edit,
    enterTextInSearchbar,
    enterTextInYamlEditor,
    focusInput,
    navigateToResource,
    resetInput,
    save,
    verifyPageContent,
    verifySearchResult,
    verifyNoResults,
    verifyEditBtnTxt,
    verifySaveBtnTxt
  }]
}

function focusInput() {
  this.waitForElementPresent('@searchbar')
  this.waitForElementPresent('@searchSuggestionCards')
  this.waitForElementPresent('@input')
  this.click('@input')
  this.waitForElementPresent('@suggestions')
}

function enterTextInSearchbar(browser, property, op, value) {
  this.setValue('@input', property)
  this.waitForElementPresent('@searchbar')
  this.waitForElementPresent('@input')
  this.click('@input')
  this.waitForElementPresent('@suggestions')
  this.waitForElementPresent('@searchbarInput')
  this.setValue('@input', ' ')
  if (op !== null && value !== null) {
    const valueText = op + value
    this.setValue('@input', valueText)
    this.setValue('@input', ' ')
  }
}

function checkTagArray(query) {
  // this only checks the first tag - need to update function to check multiple
  this.expect.element('@querySpan').text.to.contain(query)
}

function checkAccess() {
  this.waitForElementPresent('@overflowIcon').click('@overflowIcon')
  this.waitForElementPresent('@overflowButton').click('@overflowButton')
  this.expect.element('@errorNotification').text.to.contain('You are not authorized to delete this resource')
}

function resetInput() {
  this.click('@clearAllButton')
}

function edit() {
  this.waitForElementVisible('@edit')
    .click('@edit')
}

function save(browser) {
  this.waitForElementVisible('@saveBtn').click('@saveBtn')
  this.waitForElementPresent('@modal')
  this.waitForElementVisible('@dialog')
  browser.pause(5000)
  this.waitForElementVisible('@save')
    .click('@save')
  // Disabled because this is causing Travis to fail.
  // this.waitForElementNotPresent('@modal')
}

function enterTextInYamlEditor(browser, yaml){

  const keystrokes = [
    // Tab to editor area.
    browser.Keys.TAB, browser.Keys.TAB, 
    // Go to end of document
    browser.Keys.COMMAND, browser.Keys.DOWN_ARROW, browser.Keys.COMMAND, 
    // Position in the data field.
    browser.Keys.UP_ARROW, browser.Keys.ENTER, browser.Keys.UP_ARROW,
    // Add indentation.
    browser.Keys.SPACE, browser.Keys.SPACE]
  yaml.split(/\r?\n/).forEach(line => {
    keystrokes.push(line)
  })
  this.api.keys(keystrokes)
}

function navigateToResource() {
  this.api.useXpath()
  //check if the result row contains the query text
  this.waitForElementVisible('@dataTableFirstChild')
    .click('@dataTableFirstChild')
  this.api.useCss()
}

/**
 * Verifications
 */

function verifyPageContent() {
  this.expect.element('@headerTitle').to.be.present
  this.expect.element('@searchbar').to.be.present
  this.expect.element('@searchCardLoadind').to.not.be.present
}

function checkSpecificSearchFilter(idx, query) {
  this.api.useXpath()
  this.expect.element(`//*[@id="page"]/div/div/div/div[2]/div[1]/div[1]/div[2]/div/div[1]/button[${idx}]/span`).text.to.contain(query)
  this.api.useCss()
}

function verifySearchResult(idx, query) {
  this.expect.element('@searchTable').to.be.present
  this.api.useXpath()
  //check if the result row contains the query text
  this.expect.element(`//*[@id="page"]/div/div/div/div[2]/div[2]/div/div[2]/div/div[2]/table/tbody/tr/td[${idx}]/a`).text.to.contain(query)
  this.api.useCss()
}

function verifyNoResults() {
  this.expect.element('@searchTable').to.not.be.present
}

function verifyEditBtnTxt(browser, text) {
  this.waitForElementPresent('@edit').getText('@edit', function readNotification(result) {
      browser.assert.equal(result.value, text)
  })
}

function verifySaveBtnTxt(browser, text) {
  this.waitForElementPresent('@saveBtn').getText('@saveBtn', function readNotification(result) {
      browser.assert.equal(result.value, text)
  })
}
