/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { searchPage } from "./search";

export const searchBar = {
  shouldContainTag: (filter) => {
    cy.get(".react-tags__selected-tag-name").should("contain", filter);
  },
};

export const savedSearches = {
  whenSelectCardWithTitle: (title) => {
    cy.get(".pf-c-card__title").contains(title).click();
  },
  whenRelatedItemsExist: () => {
    cy.get(".pf-l-gallery").get(".pf-c-skeleton").should("not.exist");
    cy.get(".pf-l-gallery").children().and("have.length.above", 1);
  },
  whenGetRelatedItemDetails: (resource) => {
    return cy
      .contains(".search--resource-table", resource)
      .find("table.bx--data-table-v2 tbody tr")
      .parent();
  },
  whenVerifyRelatedItemsDetails: () => {
    searchPage.shouldLoadResults();
    cy.wait(1000); // Adding a delay, so the skeletons will not confuse cypress when searching for the related tiles.

    cy.get(".pf-l-gallery.pf-m-gutter").then(($related) => {
      if ($related.children().length > 0) {
        cy.get(".pf-c-tile__body").first().click();
        cy.get(".pf-c-expandable-section__toggle-text").should(
          "contain.text",
          "Related"
        );
      }
    });
  },
};
