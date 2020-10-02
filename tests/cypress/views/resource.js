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
    // WORKAROUND: delays are needed because this cypress issue https://github.com/cypress-io/cypress/issues/5480
    cy.get('.react-monaco-editor-container').click().focused().type('{ctrl}a')
      .type('{enter}apiVersion: v1{enter}', { delay: 100 })
      .type('kind: Namespace{enter}', { delay: 100 })
      .type('metadata:{enter}', { delay: 100 })
      .type('  name: ' + namespace + '{enter}', { delay: 100 });
    resourcePage.shouldCreateResource();
  },
  whenCreateDeployment: (namespace, name, image) => {
    // WORKAROUND: delays are needed because this cypress issue https://github.com/cypress-io/cypress/issues/5480
    cy.get('.react-monaco-editor-container').click().focused().type('{ctrl}a')
      .type('{enter}apiVersion: apps/v1{enter}', { delay: 100 })
      .type('kind: Deployment{enter}', { delay: 100 })
      .type('metadata:{enter}', { delay: 100 })
      .type('  name: ' + name + '{enter}{backspace}', { delay: 100 })
      .type('  namespace: ' + namespace + '{enter}{backspace}', { delay: 100 })
      .type('spec:{enter}', { delay: 100 })
      .type('  replicas: 1{enter}{backspace}', { delay: 100 })
      .type('  selector:{enter}{backspace}', { delay: 100 })
      .type('    matchLabels:{enter}{backspace}{backspace}', { delay: 100 })
      .type('      app: ' + name + '{enter}{backspace}{backspace}{backspace}', { delay: 100 })
      .type('  template:{enter}{backspace}', { delay: 100 })
      .type('    metadata:{enter}{backspace}{backspace}', { delay: 100 })
      .type('      labels:{enter}{backspace}{backspace}{backspace}', { delay: 100 })
      .type('        app: ' + name + '{enter}{backspace}{backspace}{backspace}{backspace}', { delay: 100 })
      .type('    spec:{enter}{backspace}{backspace}', { delay: 100 })
      .type('      containers:{enter}{backspace}{backspace}{backspace}', { delay: 100 })
      .type('        - name: ' + name + '{enter}{backspace}{backspace}{backspace}{backspace}', { delay: 100 })
      .type('          image: ' + image + '{enter}', { delay: 100 });
    resourcePage.shouldCreateResource();
  },
  shouldCreateResource: () => {
    cy.get('.bx--btn--primary').click();
    cy.get('.bx--inline-notification', { timeout: 60000 }).should('not.exist');
    cy.get('.react-monaco-editor-container', { timeout: 60000 }).should('not.exist');
  }
}
