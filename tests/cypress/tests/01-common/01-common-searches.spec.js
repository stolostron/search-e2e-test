/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from "../../config";
import { cliHelper } from "../../scripts/cliHelper";
import { searchPage } from "../../views/search";

const postfix = Date.now();
const appName = `auto-test-app-${postfix}`;

const namespace = cliHelper.generateNamespace();

describe("RHACM4K-913: Search - common filter and conditions", function () {
  beforeEach(function () {
    searchPage.whenGoToSearchPage();
  });

  context(
    "verify search result with common filter and conditions",
    function () {
      it(`[P1][Sev1][${squad}] should create namespace and application`, function () {
        cliHelper.createNamespace(namespace);
        cliHelper.createApplication(appName, namespace);
      });

      it(`[P1][Sev1][${squad}] should login`, function () {
        cy.login();
      });

      it(`[P2][Sev2][${squad}] should find expected application and delete application`, function () {
        searchPage.shouldFindApplicationInNS(appName, namespace);
        searchPage.shouldDeleteApplicationInNS(appName, namespace);
        cliHelper.deleteNamespace(namespace);
      });
    }
  );
});
