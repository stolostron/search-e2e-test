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
    searchSuggestionCards: '.saved-search-query-header',
    searchbar: '.react-tags',
    searchbarInput: '.react-tags__search-input',
    suggestions: '.react-tags__suggestions',
    tableHeader: '.search--resource-table-header-button',
    tableHeaderLast: '.search--resource-table-header-button:last-child',
    queryTerms: '.react-tags__selected',
    searchTable: '.bx--data-table-v2.bx--data-table-v2--zebra',
    overflow: 'div.bx--overflow-menu',
    overflowIcon: '.bx--overflow-menu__icon',
    overflowButton: '.bx--overflow-menu-options__btn',
    delete: 'button[class="bx--overflow-menu-options__btn"]',
    confirmDel: 'button[class="bx--btn bx--btn--danger--primary"]',
    errorNotification: '.bx--inline-notification__subtitle',

    // YAML/Edit elements
    yamlDisplay: "div.resource-details-page",
    edit: 'button[class="bx--btn bx--btn--primary"]',
    yamlContainer: "div.page-content-container",
    textArea: "textarea.ace_text-input" ,
    save: 'button[class="bx--btn bx--btn--danger--primary"]',
    dialog: "div.bx--modal-container",
    aceEditorTextInput: '#brace-editor',
    registerAppModal: '.bx--modal'
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
    verifyEditBtnTxt
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
  this.waitForElementPresent('@registerAppModal')
  this.waitForElementVisible('@dialog')
  browser.pause(3000)
  this.waitForElementVisible('@save')
    .click('@save')
  this.waitForElementNotPresent('@registerAppModal')
}

function enterTextInYamlEditor(browser, yaml){
  this.waitForElementPresent('@registerAppModal')
  this.click('@aceEditorTextInput')

  const keystrokes = []
  yaml.split(/\r?\n/).forEach(line => {
    const indentation = line.search(/\S|$/)
    keystrokes.push(line)
    keystrokes.push(browser.Keys.RETURN)
    for (let i = 0; i < indentation / 2; i++ )
      keystrokes.push(browser.Keys.BACK_SPACE)
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
      console.log('active line Response(s)', result);
      browser.assert.equal(result.value, text)
  })
}
