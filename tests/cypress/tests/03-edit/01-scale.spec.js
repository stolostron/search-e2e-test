/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from "../../config";
import { cliHelper } from "../../scripts/cliHelper";
import { searchPage, searchBar } from "../../views/search";
import { deploymentDetailPage } from "../../views/deploymentDetailPage";

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

    after(function () {
      cliHelper.deleteNamespace(this.namespace);
    });

    describe("search resources", function () {
      beforeEach(function () {
        searchBar.whenFilterByNamespace(this.namespace);
        searchBar.whenFilterByCluster(this.clusterName);
        searchPage.shouldLoadResults();
      });

      it(`[P2][Sev2][${squad}] should delete pod`, function () {
        searchBar.whenFilterByKind("pod");
        searchPage.whenDeleteResourceDetailItem(
          "pod",
          this.namespace + "-deployment"
        );
        searchPage.shouldBeResourceDetailItemCreatedFewSecondsAgo(
          "pod",
          this.namespace + "-deployment"
        );
      });

      it(`[P3][Sev3][${squad}] should scale deployment`, function () {
        searchBar.whenFilterByKind("deployment");
        searchPage.whenGoToResourceDetailItemPage(
          "deployment",
          this.namespace + "-deployment"
        );
        deploymentDetailPage.whenScaleReplicasTo(2);
      });

      it(`[P3][Sev3][${squad}] should verify that the deployment scaled`, function () {
        searchBar.whenFilterByKind("deployment");
        searchPage.whenGetResourceTableRow(
          "deployment",
          this.namespace + "-deployment"
        );
        searchPage.shouldFindRelationshipTile("pod", "2");
      });
    });
  });
});
