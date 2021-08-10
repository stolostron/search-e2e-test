/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from "../../config";
import { cliHelper } from "../../scripts/cliHelper";
import { searchPage, searchBar } from "../../views/search";

const clusterModes = [
  { label: "Local", valueFn: () => cy.wrap("local-cluster"), skip: false },
  {
    label: "Managed",
    valueFn: () => cliHelper.getTargetManagedCluster(),
    skip: true,
  },
];

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return;
  }

  describe("Search: Search in " + clusterMode.label + " Cluster", function () {
    before(function () {
      clusterMode.valueFn().as("clusterName");
      cy.generateNamespace().as("namespace");
    });

    before(function () {
      cliHelper.createNamespace(this.namespace);
      cliHelper.createDeployment(
        this.namespace + "-deployment",
        this.namespace,
        "openshift/hello-openshift"
      );
      cy.login();
    });

    beforeEach(function () {
      searchPage.whenGoToSearchPage();
    });

    describe("search resources", function () {
      beforeEach(function () {
        searchBar.whenFilterByNamespace(this.namespace, true);
        searchBar.whenFilterByCluster(this.clusterName, true);
        searchPage.shouldLoadResults();
      });

      it(`[P2][Sev2][${squad}] should delete deployment`, function () {
        searchBar.whenFilterByKind("deployment");
        searchPage.whenDeleteResourceDetailItem(
          "deployment",
          this.namespace + "-deployment"
        );
      });

      it(`[P2][Sev2][${squad}] should validate deployment was deleted`, function () {
        searchBar.whenFilterByKind("deployment", true);
        searchBar.whenFilterByName(this.namespace + "-deployment", true);
        searchPage.shouldFindNoResults();
      });

      it(`[P2][Sev2][${squad}] should delete namespace`, function () {
        searchPage.whenDeleteNamespace(this.namespace);
        cy.waitUsingSLA(); // WORKAROUND to wait for resource to get indexed. Better solution is to retry instead of a hard wait.
      });

      it(`[P2][Sev2][${squad}] should validate namespace was deleted`, function () {
        searchPage.shouldFindNoResults();
      });
    });
  });
});
