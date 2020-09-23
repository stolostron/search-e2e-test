/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

export const resourcePage = {
  whenGoToResourcePage: () => cy.get('#acm-create-resource', { timeout: 20000 }).click(),
  whenSelectTargetCluster: (clusterName) => {
    cy.get('#create-resource-select', { timeout: 20000 }).click()
    cy.get('.bx--checkbox-wrapper input[name="' + clusterName + '"]').parent().click()
  },
  whenCreateNamespace: (namespace) => {
    cy.get('.react-monaco-editor-container').click().focused().type('{ctrl}a')
      .type('{enter}apiVersion: v1{enter}')
      .type('kind: Namespace{enter}')
      .type('metadata:{enter}')
      .type('  name: ' + namespace + '{enter}');
    resourcePage.shouldCreateResource();
  },
  whenCreateDeployment: (namespace, name, image) => {
    cy.get('.react-monaco-editor-container').click().focused().type('{ctrl}a')
      .type('{enter}apiVersion: apps/v1{enter}')
      .type('kind: Deployment{enter}')
      .type('metadata:{enter}')
      .type('  name: ' + name + '{enter}{backspace}')
      .type('  namespace: ' + namespace + '{enter}{backspace}')
      .type('spec:{enter}')
      .type('  replicas: 1{enter}{backspace}')
      .type('  selector:{enter}{backspace}')
      .type('    matchLabels:{enter}{backspace}{backspace}')
      .type('      app: ' + name + '{enter}{backspace}{backspace}{backspace}')
      .type('  template:{enter}{backspace}')
      .type('    metadata:{enter}{backspace}{backspace}')
      .type('      labels:{enter}{backspace}{backspace}{backspace}')
      .type('        app: ' + name + '{enter}{backspace}{backspace}{backspace}{backspace}')
      .type('    spec:{enter}{backspace}{backspace}')
      .type('      containers:{enter}{backspace}{backspace}{backspace}')
      .type('        - name: ' + name + '{enter}{backspace}{backspace}{backspace}{backspace}')
      .type('          image: ' + image + '{enter}');
    resourcePage.shouldCreateResource();
  },
  shouldCreateResource: () => {
    cy.get('.bx--btn--primary').click();
    cy.get('.bx--inline-notification', { timeout: 60000 }).should('not.exist');
    cy.get('.react-monaco-editor-container', { timeout: 60000 }).should('not.exist');
  }
}
