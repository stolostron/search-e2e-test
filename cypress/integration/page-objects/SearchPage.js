/**
 * Copyright (c) 2020 Red Hat, Inc.
 */

export const page = {
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
  commands: {
    navigate,
    checkTagArray,
    focusInput,
    enterTextInSearchbar,
    navigateToResource,
    verifyPageContent
  }
}

/**
 * Focuses on the input field on the search page.
 */
function focusInput() {
  cy.get(page.elements.searchbar)
  cy.get(page.elements.searchSuggestionCards)
  cy.get(page.elements.input).click()
  cy.get(page.elements.suggestions)
}

/**
 * Enter text in the selected search bar on the search page.
 * @param {*} property 
 * @param {*} op 
 * @param {*} value 
 */
function enterTextInSearchbar(property, op, value) {
  cy.get(page.elements.input).click().type(property)
  cy.get(page.elements.searchbar)
  cy.get(page.elements.searchbarInput).click().type(op)
  cy.get(page.elements.suggestions)
  cy.get(page.elements.searchbarInput).click().type(value).type(op)
}

/**
 * Check the tag array of the query.
 * @param {*} query 
 */
function checkTagArray(query) {
  cy.get(page.elements.querySpan).contains(query)
}

function checkAccess() {}
function resetInput() {}
function edit() {}
function save() {}

/**
 * Navigate to the Multicloud web-console.
 * @param {*} query 
 */
function navigate(url) {
  cy.visit(url)
}

function navigateToResource() {
  cy.get('@dataTableFirstChild').click('@dataTableFirstChild')
}

/**
 * 
 */
function verifyPageContent() {
  cy.expect(page.elements.headerTitle).to.exist
  cy.expect(page.elements.searchbar).to.exist
  cy.expect(page.elements.searchCardLoading).to.exist
}
