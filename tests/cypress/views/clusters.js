/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

export const clustersPage = {
  givenManagedCluster: () => {
    cy.visit('/multicloud/clusters');

    return cy.contains('table.resource-table th', 'Name', {timeout: 6000}).invoke('index')
             .then((index) => cy.get('table.resource-table tbody tr').eq(0).get('td').eq(index).invoke('text'));
  }
}
