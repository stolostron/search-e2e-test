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
    delete: 'button[class="bx--overflow-menu-options__btn"]',
    confirmDel: 'button[class="bx--btn bx--btn--danger--primary"]'

  },
  commands: [{
    focusInput,
    enterTextInSearchbar,
    checkTagArray,
    resetInput,
    verifyPageContent,
    checkSpecificSearchFilter,
    verifySearchResult ,
    deleteResult
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

function resetInput() {
  this.click('@clearAllButton')
}

/**
 * Verifications
 */

function verifyPageContent() {
  this.expect.element('@headerTitle').to.be.present
  this.expect.element('@searchbar').to.be.present
}

function checkSpecificSearchFilter(idx, query) {
  this.expect.element('@searchTable').to.be.present
  this.api.useXpath()
  this.expect.element(`//*[@id="page"]/div/div/div/div[2]/div[1]/div[1]/div[2]/div/div[1]/button[${idx}]/span`).text.to.contain(query)
  this.api.useCss()
}

function verifySearchResult(idx, query) {
  this.expect.element('@searchTable').to.be.present
  this.api.useXpath()
  //check if the result row contains the query text
  this.expect.element(`//*[@id="page"]/div/div/div/div[2]/div[2]/div/div/div[2]/table/tbody/tr/td[${idx}]/a`).text.to.contain(query)
  this.api.useCss()
}

function deleteResult(){
  this.expect.element('@searchTable').to.be.present
  this.waitForElementPresent('@overflow')
  .click('@overflow')
  this.waitForElementPresent('@delete')
  .click('@delete')
  this.waitForElementPresent('@confirmDel')
  .click('@confirmDel')
}
