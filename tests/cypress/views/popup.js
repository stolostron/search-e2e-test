/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

export const popupModal = {
  whenAccept: () => {
    popupModal.shouldExist().click();
    cy.get(".pf-c-alert pf-m-inline pf-m-danger").should("not.exist");
    popupModal.shouldNotExist();
  },
  shouldNotExist: () =>
    cy.get("button.pf-m-danger", { timeout: 30000 }).should("not.exist"),
  shouldExist: () => cy.get("button.pf-m-danger", { timeout: 30000 }),
};
