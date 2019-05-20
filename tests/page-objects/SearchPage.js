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
    headerTitle: '.bx--detail-page-header-title',
    searchbar: '.react-tags',
    searchbarInput: '.react-tags__search-input',
    input: 'input',
    tableHeader: '.search--resource-table-header-button',
    tableHeaderLast: '.search--resource-table-header-button:last-child',
    clearAllButton: '.tagInput-cleanButton',
    dateTableCell: 'td:last-child',
    querySpan: '.react-tags__selected-tag-name',
    suggestions: '.react-tags__suggestions'
  },
  commands: [{
    focusInput,
    enterTextInSearchbar,
    checkTagArray,
    resetInput,
    verifyPageContent
  }]
}

function focusInput() {
  this.waitForElementPresent('@searchbar')
    .click('@input')
  this.waitForElementPresent('@suggestions')
}

function enterTextInSearchbar(browser, property, op, value) {
  this.setValue('@input', property)
  this.setValue('@input', ' ')
  this.waitForElementPresent('@suggestions')
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
