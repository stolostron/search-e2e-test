/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

export const suggestedTemplate = {
    whenSelectCreatesLastHour:() => {
      cy.get('.suggested-search-queries').children('.query-cards-container').children().eq(2).click()
      cy.get('.react-tags__selected-tag-name').should('contain', 'created:hour')
    },
    whenSelectWorkloads:() => {
      cy.get('.suggested-search-queries').children('.query-cards-container').children().eq(0).click()
      cy.get('.react-tags__selected-tag-name').should('contain', 'kind:daemonset,deployment,job,statefulset,replicaset')
    },
    whenSelectUnhealthyPods:() => {
      cy.get('.suggested-search-queries').children('.query-cards-container').children().eq(1).click()
      cy.get('.react-tags__selected-tag-name').should('contain', 'kind:pod')
      cy.get('.react-tags__selected-tag-name').should('contain','status:Pending,Error,Failed,Terminating,ImagePullBackOff,CrashLoopBackOff,RunContainerError,ContainerCreating')
    },
    whenGetRelatedItemDetails:(resource) => {
      return cy.contains('.search--resource-table', resource, {timeout: 20000})
               .find('table.bx--data-table-v2 tbody tr', {timeout: 20000})
               .parent();
    },
    whenVerifyRelatedItemsDetails:() => {
      cy.waitUsingSLA()
      cy.get('.page-content-container > :nth-child(2)').then(($span) => {
      if (($span.text()) !== 'No search results found.')
      {
        cy.contains('Show all').click()
        cy.get('.bx--tile-content > :nth-child(1) > .content > .text').each(($el) => {
            const itemName = $el.text()
            cy.wrap($el).click()
         suggestedTemplate.whenGetRelatedItemDetails(itemName).should('exist', {timeout: 20000} )
         cy.wrap($el).click()
        })
      }
     })
    }
  }