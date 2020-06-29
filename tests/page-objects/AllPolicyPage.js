/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018, 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************
/* Copyright (c) 2020 Red Hat, Inc. */

module.exports = {
  elements: {
    spinner: '.content-spinner',
    table: '.bx--data-table-v2',
    tableExpandBtn: '.bx--table-expand-v2__button:nth-of-type(1)',
    expandTable: '.bx--expandable-row-v2:nth-of-type(2)',
    createPolicyButton: '.bx--btn--primary:nth-of-type(1)',
    submitCreatePolicyButton: '#create-button-portal-id',
    yamlMonacoEditor: '.monaco-editor',
    searchInput: 'input.bx--search-input',
    overflowButton: '.bx--overflow-menu:nth-of-type(1)',
    deleteButton: '.bx--overflow-menu-options__option--danger',
    confirmDeleteButton: '.bx--btn--danger--primary',
    noResource: '.no-resource',
    policyStatus: '#complianceStatus-module-id',
    policyNameInput: '#name',
    namespaceDropdown: '.creation-view-controls-container > div > div:nth-child(2) > div.bx--list-box',
    namespaceDropdownBox: '.creation-view-controls-container > div > div:nth-child(2) > div.bx--list-box > div.bx--list-box__menu',
    templateDropdown: '.creation-view-controls-container > div > div:nth-child(3) > div.bx--multi-select.bx--list-box',
    templateDropdownBox: '.creation-view-controls-container > div > div:nth-child(3) > div.bx--multi-select.bx--list-box > div.bx--list-box__menu',
    clusterSelectorDropdown: '.creation-view-controls-container > div > div:nth-child(4) > div.bx--multi-select.bx--list-box > div.bx--list-box__field',
    clusterSelectorDropdownBox: '.creation-view-controls-container > div > div:nth-child(4) > div.bx--multi-select.bx--list-box > div.bx--list-box__menu',
    enforce: '.creation-view-controls-checkbox > div.bx--form-item.bx--checkbox-wrapper',
    standardsDropdown: '.creation-view-controls-container > div > div:nth-child(5) > div.bx--multi-select.bx--list-box',
    standardsDropdownBox: '.creation-view-controls-container > div > div:nth-child(5) > div.bx--multi-select.bx--list-box > div.bx--list-box__menu',
    categoriesDropdown: '.creation-view-controls-container > div > div:nth-child(6) > div.bx--multi-select.bx--list-box',
    categoriesDropdownBox: '.creation-view-controls-container > div > div:nth-child(6) > div.bx--multi-select.bx--list-box > div.bx--list-box__menu',
    controlsDropdown: '.creation-view-controls-container > div > div:nth-child(7) > div.bx--multi-select.bx--list-box',
    controlsDropdownBox: '.creation-view-controls-container > div > div:nth-child(7) > div.bx--multi-select.bx--list-box > div.bx--list-box__menu',
    summaryCollapse: 'button.collapse > span.collapse-button',
    summaryInfoContainer: 'div.module-grc-cards > div.card-container-container',
    summaryDropdown: 'div.module-grc-cards > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(1)',
    summaryDropdownBox: 'div.module-grc-cards > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(2)',
    filterClear: '.resource-filter-bar > span.button',
  },
  commands: [{
    verifySummary,
    verifyTable,
    verifyPagination,
    createTestPolicy,
    searchPolicy,
    testDetailsPage,
    deletePolicy,
    verifyDisableEnable,
  }]
}
function verifySummary(browser, url) {
  this.waitForElementVisible('button.collapse > span.collapse-button')
  this.waitForElementVisible('div.module-grc-cards > div.card-container-container')
  this.waitForElementVisible('@summaryInfoContainer')
  this.navigate(url + '?card=false&index=0')
  this.waitForElementNotPresent('@summaryInfoContainer')
  this.navigate(url + '?card=true&index=0')
  this.waitForElementVisible('@summaryInfoContainer')
  //standards summary
  this.waitForElementVisible('@summaryDropdown')
  this.click('@summaryDropdown')
  browser.pause(1000)//wait 1s for every click
  const dropdownBox = 'div.module-grc-cards > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(2)'
  //Categories summary
  this.click(dropdownBox + ' > div:nth-child(1)')
  browser.pause(1000)
  checkPolicySummaryCards.call(this, browser)
  browser.pause(1000)//wait 1s for checkPolicySummaryCards func
  //Standards summary
  this.click('@summaryDropdown')
  browser.pause(1000)
  this.click(dropdownBox + ' > div:nth-child(2)')
  browser.pause(1000)
  checkPolicySummaryCards.call(this, browser)
}
function checkPolicySummaryCards(browser) {
  browser.elements('css selector','div.module-grc-cards > div:nth-child(2) > div', (cards) => {
    for (let cardNum = 1; cardNum < cards.value.length + 1; cardNum++) {
      for (let i = 1; i <= 2; i++) {
        const cardInfo = `div.module-grc-cards > div:nth-child(2) > div:nth-child(${cardNum}) > div > div > div:nth-child(2)`
        this.waitForElementVisible(cardInfo)
        browser.element('css selector', cardInfo + ' > .empty-violations-strip', function(result){
          if(result.value === false) {
            this.click(cardInfo + ` > div:nth-child(${i})`)
            browser.pause(1000)
            browser.element('css selector', '.resource-filter-bar > span.button', function(result2){
              if(result2.value !== false) {
                //first card of each category is cluster (no drop-down), second is policy
                verifyTable(browser, (i % 2 !== 0))
                this.click('div.resource-filter-bar > span.button')
                browser.pause(1000)//wait 1s for cleaning resource filters
              }
            })
          }
        })
      }
    }
  })
}
function verifyTable(browser, cluster) {
  browser.element('css selector', 'div.no-resource', function(result){
    if(result.status !== -1){
      this.waitForElementVisible('div.no-resource')
    }
    else{
      this.waitForElementVisible('table.bx--data-table-v2.resource-table.bx--data-table-v2--zebra')
      if (!cluster) {
        this.click('button.bx--table-expand-v2__button:nth-of-type(1)')
        this.waitForElementVisible('tr.bx--expandable-row-v2:nth-of-type(2)')
        this.click('button.bx--table-expand-v2__button:nth-of-type(1)')
        this.waitForElementVisible('tr.bx--expandable-row-v2:nth-of-type(2)')
        this.click('table.bx--data-table-v2.resource-table.bx--data-table-v2--zebra > tbody > tr:nth-child(1) > td:nth-child(9) > div > svg')
        this.waitForElementVisible('ul.bx--overflow-menu-options.bx--overflow-menu--flip.bx--overflow-menu-options--open')
        this.click('ul.bx--overflow-menu-options.bx--overflow-menu--flip.bx--overflow-menu-options--open > li:nth-child(1)')
      }
      else {
        this.click('table.bx--data-table-v2.resource-table.bx--data-table-v2--zebra > tbody > tr:nth-child(1) > td:nth-child(5) > div > svg')
        this.waitForElementVisible('ul.bx--overflow-menu-options.bx--overflow-menu--flip.bx--overflow-menu-options--open')
        this.click('ul.bx--overflow-menu-options.bx--overflow-menu--flip.bx--overflow-menu-options--open > li:nth-child(1)')
      }
      this.waitForElementVisible('div.bx--modal.is-visible')
      this.click('button.bx--modal-close')
      this.waitForElementNotPresent('div.bx--modal.is-visible')
    }
  })
}
function verifyPagination() {
  const pagination = '.bx--pagination'
  this.waitForElementVisible(pagination)
  this.click('select[id="bx-pagination-select-resource-table-pagination"] option[value="5"]')
  this.waitForElementVisible('.bx--pagination__button.bx--pagination__button--forward')
  this.click('.bx--pagination__button.bx--pagination__button--forward')
  this.waitForElementVisible('.bx--pagination__button.bx--pagination__button--backward')
  this.click('.bx--pagination__button.bx--pagination__button--backward')
  this.click('select[id="bx-pagination-select-resource-table-pagination"] option[value="10"]')
}
function createTestPolicy(browser, time) {
  this.waitForElementVisible('@createPolicyButton')
  this.click('@createPolicyButton')
  this.waitForElementNotPresent('@spinner')
  // browser.pause(100000)
  this.expect.element('@yamlMonacoEditor').to.be.present
  this.click('@yamlMonacoEditor')
  this.click('@policyNameInput').clearValue('@policyNameInput')
  this.setValue('@policyNameInput',`${time}-policy-test`)
  this.click('@namespaceDropdown')
  this.waitForElementVisible('@namespaceDropdownBox')
  // this.setValue('div.creation-view-controls-container > div > div:nth-child(2) > div.bx--list-box > .bx--list-box__field > input', 'Namespace')
  this.click('div.creation-view-controls-container > div > div:nth-child(2) > div.bx--list-box > div.bx--list-box__menu > div:nth-child(1)')
  this.click('@templateDropdown').expect.element('@templateDropdownBox').to.be.present
  this.setValue('div.creation-view-controls-container > div > div:nth-child(3) > div.bx--multi-select.bx--list-box > .bx--list-box__field > input', 'Namespace')
  this.click('div.creation-view-controls-container > div > div:nth-child(3) > div.bx--multi-select.bx--list-box > div.bx--list-box__menu > div:nth-child(1)')
  this.waitForElementNotPresent('@templateDropdownBox')
  this.click('@clusterSelectorDropdown')
  this.waitForElementVisible('@clusterSelectorDropdownBox')
  // this.setValue('div.creation-view-controls-container > div > div:nth-child(4) > div.bx--multi-select.bx--list-box > .bx--list-box__field > input', 'cloud: "IBM')
  this.click('div.creation-view-controls-container > div > div:nth-child(4) > div.bx--multi-select.bx--list-box > div.bx--list-box__menu > div:nth-child(3)')
  this.click('@clusterSelectorDropdown')
  this.waitForElementNotPresent('@clusterSelectorDropdownBox')
  // this.click('@standardsDropdown').expect.element('@standardsDropdownBox').to.be.present
  // this.setValue('div.creation-view-controls-container > div > div:nth-child(5) > div.bx--multi-select.bx--list-box > .bx--list-box__field > input', 'NIST')
  // this.click('div.creation-view-controls-container > div > div:nth-child(5) > div.bx--multi-select.bx--list-box > div.bx--list-box__menu > div:nth-child(1)')
  // this.click('@standardsDropdown').expect.element('@standardsDropdownBox').not.to.be.present
  // this.click('@categoriesDropdown').expect.element('@categoriesDropdownBox').to.be.present
  // this.setValue('div.creation-view-controls-container > div > div:nth-child(6) > div.bx--multi-select.bx--list-box > .bx--list-box__field > input', 'SecurityContinuousMonitoring')
  // this.click('div.creation-view-controls-container > div > div:nth-child(6) > div.bx--multi-select.bx--list-box > div.bx--list-box__menu > div:nth-child(1)')
  // this.click('@categoriesDropdown').expect.element('@categoriesDropdownBox').not.to.be.present
  // this.click('@controlsDropdown').expect.element('@controlsDropdownBox').to.be.present
  // // this.setValue('div.creation-view-controls-container > div > div:nth-child(7) > div.bx--multi-select.bx--list-box > .bx--list-box__field > input', 'VA')
  // this.click('div.creation-view-controls-container > div > div:nth-child(7) > div.bx--multi-select.bx--list-box > div.bx--list-box__menu > div:nth-child(1)')
  // this.click('@controlsDropdown').expect.element('@controlsDropdownBox').not.to.be.present
  this.waitForElementNotPresent('@spinner')
  this.waitForElementVisible('@submitCreatePolicyButton')
  this.click('@submitCreatePolicyButton')
  this.expect.element('@table').to.be.present
}
function searchPolicy(expectToDisplay, time) {
  this.waitForElementVisible('@searchInput')
  this.setValue('@searchInput',`${time}-policy-test`)
  this.waitForElementVisible('@searchInput')
  if(expectToDisplay){
    this.expect.element('tbody>tr').to.have.attribute('data-row-name').equals(`${time}-policy-test`)
  } else{
    this.waitForElementNotPresent('tbody>tr')
    this.click('@searchInput').clearValue('@searchInput')
  }
}
function testDetailsPage(browser, name) {
  this.click('tbody>tr>td>a')
  //overview tab test
  this.expect.element('.bx--detail-page-header-title').text.to.equal(name)
  this.expect.element('.section-title:nth-of-type(1)').text.to.equal('Policy details')
  this.expect.element('.new-structured-list > table:nth-child(1) > tbody > tr:nth-child(1) > td:nth-child(2)').text.to.equal(name)
  this.expect.element('.overview-content > div:nth-child(2) > .section-title').text.to.equal('Placement')
  this.waitForElementVisible('.overview-content-second > div:nth-child(1) > div > div > div:nth-child(1) > .bx--module__title')
  this.expect.element('.overview-content-second > div:nth-child(1) > div > div > div:nth-child(1) > .bx--module__title').text.to.equal('Placement rule')
  this.expect.element('.overview-content-second > div:nth-child(1) > div > div > .bx--module__content > section > div > div:nth-child(1) > div:nth-child(2)').text.to.equal('placement-' + name)
  this.expect.element('.overview-content-second > div:nth-child(2) > div > div > div:nth-child(1) > .bx--module__title').text.to.equal('Placement binding')
  this.expect.element('.overview-content-second > div:nth-child(2) > div > div > .bx--module__content > section > div > div:nth-child(1) > div:nth-child(2)').text.to.equal('binding-' + name)
  this.expect.element('.overview-content > div:nth-child(3) > .section-title').text.to.equal('Policy templates')
  //violation tab test
  this.waitForElementVisible('#violation-tab')
  this.click('#violation-tab')
  this.waitForElementNotPresent('#spinner')
  this.waitForElementNotPresent('#spinner')
  // Temp disable violation table test - Adam Kang 11Nov19
  // this.waitForElementVisible('.policy-violation-tab > .section-title', 15000, false, (result) => {
  //   if(result.value === false){
  //     browser.expect.element('.no-resource').to.be.present
  //   }
  //   else{
  //     browser.expect.element('.policy-violation-tab > .section-title').text.to.equal('Violations')
  //   }
  // })
  //policy yaml page test
  this.waitForElementVisible('#yaml-tab')
  this.click('#yaml-tab')
  this.waitForElementVisible('.monaco-editor')
  this.waitForElementVisible('.yaml-editor-button > button:nth-child(1)')
  this.waitForElementVisible('.yaml-editor-button > button:nth-child(2)')
  this.click('.bx--breadcrumb > div:nth-child(1)')
}
function deletePolicy(name){
  this.waitForElementVisible('body')
  this.waitForElementVisible('@searchInput')
  this.setValue('@searchInput', name)
  this.waitForElementVisible('table.bx--data-table-v2.resource-table.bx--data-table-v2--zebra')
  this.expect.element('.bx--data-table-v2.resource-table.bx--data-table-v2--zebra > tbody > tr:nth-child(1) > td:nth-child(2) > a').text.to.equal(name)
  this.waitForElementNotPresent('bx--overflow-menu-options__option.bx--overflow-menu-options__option--danger')
  this.waitForElementVisible('table.bx--data-table-v2.resource-table.bx--data-table-v2--zebra > tbody > tr:nth-child(1) > td:nth-child(9)')
  this.click('table.bx--data-table-v2.resource-table.bx--data-table-v2--zebra > tbody > tr:nth-child(1) > td:nth-child(9) > div > svg')
  this.waitForElementVisible('ul.bx--overflow-menu-options.bx--overflow-menu--flip.bx--overflow-menu-options--open')
  this.waitForElementVisible('ul.bx--overflow-menu-options.bx--overflow-menu--flip.bx--overflow-menu-options--open > li:nth-child(4)')
  this.expect.element('ul.bx--overflow-menu-options.bx--overflow-menu--flip.bx--overflow-menu-options--open > li:nth-child(4) > button').text.to.equal('Remove')
  this.click('ul.bx--overflow-menu-options.bx--overflow-menu--flip.bx--overflow-menu-options--open > li:nth-child(4) > button')
  this.waitForElementVisible('button.bx--btn--danger--primary')
  this.click('button.bx--btn--danger--primary')
  this.waitForElementNotPresent('@spinner')
  // this.expect.element('table.bx--data-table-v2.resource-table.bx--data-table-v2--zebra > tbody > tr:nth-child(1) > td:nth-child(2) > a').not.to.be.present
}
function verifyDisableEnable(name){
  //verify table/menu exist
  this.waitForElementVisible('body')
  this.waitForElementVisible('@searchInput')
  this.waitForElementNotPresent('.bx--loading-overlay')
  this.click('@searchInput').clearValue('@searchInput')
  this.setValue('@searchInput', name)
  this.waitForElementVisible('table.bx--data-table-v2.resource-table.bx--data-table-v2--zebra')
  this.expect.element('.bx--data-table-v2.resource-table.bx--data-table-v2--zebra > tbody > tr:nth-child(1) > td:nth-child(2) > a').text.to.equal(name)
  this.waitForElementVisible('table.bx--data-table-v2.resource-table.bx--data-table-v2--zebra > tbody > tr:nth-child(1) > td:nth-child(9)')
  //disable policy
  this.click('table.bx--data-table-v2.resource-table.bx--data-table-v2--zebra > tbody > tr:nth-child(1) > td:nth-child(9) > div > svg')
  this.waitForElementVisible('ul.bx--overflow-menu-options.bx--overflow-menu--flip.bx--overflow-menu-options--open')
  this.waitForElementVisible('ul.bx--overflow-menu-options.bx--overflow-menu--flip.bx--overflow-menu-options--open > li:nth-child(3)')
  this.expect.element('ul.bx--overflow-menu-options.bx--overflow-menu--flip.bx--overflow-menu-options--open > li:nth-child(3) > button').text.to.equal('Disable')
  this.click('ul.bx--overflow-menu-options.bx--overflow-menu--flip.bx--overflow-menu-options--open > li:nth-child(3) > button')
  this.waitForElementVisible('#disable-resource-modal')
  this.click('#disable-resource-modal > div > .bx--modal-footer > .bx--btn.bx--btn--danger--primary')
  //enable policy
  this.waitForElementVisible('table.bx--data-table-v2.resource-table.bx--data-table-v2--zebra > tbody > tr:nth-child(1) > td:nth-child(9) > div > svg')
  this.click('table.bx--data-table-v2.resource-table.bx--data-table-v2--zebra > tbody > tr:nth-child(1) > td:nth-child(9) > div > svg')
  this.waitForElementVisible('ul.bx--overflow-menu-options.bx--overflow-menu--flip.bx--overflow-menu-options--open')
  this.waitForElementVisible('ul.bx--overflow-menu-options.bx--overflow-menu--flip.bx--overflow-menu-options--open > li:nth-child(3)')
  this.expect.element('ul.bx--overflow-menu-options.bx--overflow-menu--flip.bx--overflow-menu-options--open > li:nth-child(3) > button').text.to.equal('Enable')
  this.click('ul.bx--overflow-menu-options.bx--overflow-menu--flip.bx--overflow-menu-options--open > li:nth-child(3) > button')
  this.waitForElementVisible('#enable-resource-modal')
  this.click('#enable-resource-modal > div > .bx--modal-footer > .bx--btn.bx--btn--primary')
  //re-check menu
  this.waitForElementVisible('table.bx--data-table-v2.resource-table.bx--data-table-v2--zebra > tbody > tr:nth-child(1) > td:nth-child(9) > div > svg')
  this.click('table.bx--data-table-v2.resource-table.bx--data-table-v2--zebra > tbody > tr:nth-child(1) > td:nth-child(9) > div > svg')
  this.expect.element('ul.bx--overflow-menu-options.bx--overflow-menu--flip.bx--overflow-menu-options--open > li:nth-child(3) > button').text.to.equal('Disable')
}
