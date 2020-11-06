/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { clustersPage } from '../views/clusters'
import { searchPage } from '../views/search'

var apiUrl =
    Cypress.config().baseUrl.replace("multicloud-console.apps", "api") + ":6443";

const consolePublic = (token) => {
    return cy.request({
        url: apiUrl + "/api/v1/namespaces/openshift-config-managed/configmaps/console-public",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
            Accept: "application/json"
        }
    }).then(resp => {
        return resp.body['data']['consoleURL']
    })
}

const acmVersion = (token) => {
    return cy.request({
        url: Cypress.config().baseUrl + "/multicloud/header/version",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
            Accept: "application/json"
        }
    }).then(resp => {
        return resp.body['status']['currentVersion']
    })
}

const oauthTokenEndpoint = (token) => {
    return cy.request({
        url: apiUrl + "/.well-known/oauth-authorization-server",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
            Accept: "application/json"
        }
    }).then(resp => {
        return resp.body['token_endpoint']
    })
}

export const oauthIssuer = (token) => {
    return cy.request({
        url: apiUrl + "/.well-known/oauth-authorization-server",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
            Accept: "application/json"
        }
    }).then(resp => {
        return resp.body['issuer']
    })
}

export const welcomePage = {
    shouldExist: () => {
        cy.get('.welcome--introduction').should('contain', 'Welcome! Let’s get started.')
        cy.get('.welcome--svcs').should('contain', 'Go to Overview').and('contain', 'Go to Clusters').and('contain', 'Go to Applications').and('contain', 'Go to Governance and risk')
    },
    validateSvcs: () => {
        cy.contains('Go to Overview').click()
        overviewPage.shouldExist()
        cy.visit('/multicloud/welcome')
        cy.contains('Go to Clusters').click()
        cy.get('.bx--detail-page-header-title-container').should('contain', 'Clusters')
        cy.visit('/multicloud/welcome')
        cy.contains('Go to Applications').click()
        cy.get('.bx--detail-page-header-title-container').should('contain', 'Applications')
        cy.visit('/multicloud/welcome')
        cy.contains('Go to Governance and risk').click()
        cy.get('.bx--detail-page-header-title-container').should('contain', 'Governance and risk')
        cy.visit('/multicloud/welcome')
    },
    validateConnect: () => {
        cy.get('[target="dev-community"]').should('have.prop', 'href', 'https://www.redhat.com/en/blog/products')
        cy.get('[target="support"]').should('have.prop', 'href', 'https://access.redhat.com/support')
    }
}

export const overviewPage = {
    shouldExist: () => {
        cy.get('.overview-page').should('contain', 'Overview')
    }
}

export const topologyPage = {
    shouldExist: () => {
        cy.get('.bx--detail-page-header-title').should('contain', 'Topology')
    }
}

export const bmAssetPage = {
    shouldExist: () => {
        cy.get('.bx--detail-page-header-title').should('contain', 'Bare metal assets')
    }
}

export const applicationPage = {
    shouldExist: () => {
        cy.get('.bx--detail-page-header-title').should('contain', 'Applications')
    }
}

export const grcPage = {
    shouldExist: () => {
        cy.get('.bx--detail-page-header-title').should('contain', 'Governance and risk')
    }
}

export const resourcePage = {
    shouldExist: () => {
        cy.get('.bx--modal-header__heading').should('contain', 'Create resource')
    }
}

export const leftNav = {
    openMenu: () => {
        cy.get('.hamburger-btn').click()
        cy.get('#left-nav li').should('be.visible').and('have.length', 5)
        cy.get('.hamburger-btn').click()
        cy.get('#left-nav').should('not.exist')
    },
    goToHome: () => {
        cy.get('.hamburger-btn').click()
        cy.get('#left-nav').contains('Home').click()
        welcomePage.shouldExist()
    },
    goToOverview: () => {
        cy.get('.hamburger-btn').click()
        cy.get('#left-nav').contains('Observe environments').trigger('mouseover')
        cy.get('#secondary-nav').contains('Overview').click()
        overviewPage.shouldExist()
    },
    goToTopology: () => {
        cy.get('.hamburger-btn').click()
        cy.get('#left-nav').contains('Observe environments').trigger('mouseover')
        cy.get('#secondary-nav').contains('Topology').click()
        topologyPage.shouldExist()
    },
    goToClusters: () => {
        cy.get('.hamburger-btn').click()
        cy.get('#left-nav').contains('Automate infrastructure').trigger('mouseover')
        cy.get('#secondary-nav').contains('Clusters').click()
        clustersPage.shouldExist()
    },
    goToBMAssets: () => {
        cy.get('.hamburger-btn').click()
        cy.get('#left-nav').contains('Automate infrastructure').trigger('mouseover')
        cy.get('#secondary-nav').contains('Bare metal assets').click()
        bmAssetPage.shouldExist()
    },
    goToApplications: () => {
        cy.get('.hamburger-btn').click()
        cy.get('#left-nav').contains('Manage applications').click()
        applicationPage.shouldExist()
    },
    goToGRC: () => {
        cy.get('.hamburger-btn').click()
        cy.get('#left-nav').contains('Govern risk').click()
        grcPage.shouldExist()
    }
}

export const userMenu = {
    openApps: () => {
        cy.get('.navigation-container #acm-apps-dropdown').click()
        cy.getCookie('acm-access-token-cookie').should('exist').then((token) => {
            consolePublic(token.value).then((consoleURL) => {
                cy.get('#apps-dropdown-content li').should('have.length', 1).first().children().should('have.prop', 'href', consoleURL + '/')
            })
        })
    },
    openSearch: () => {
        cy.get('.navigation-container #acm-search').click()
        searchPage.shouldExist()
    },
    openResources: () => {
        cy.get('.navigation-container #acm-create-resource').click()
        resourcePage.shouldExist()
    },
    openTerminal: () => {
        cy.get('#acm-kui-dropdown #terminal-dropdown-content li').should('not.be.visible')
        cy.get('.navigation-container #acm-kui-dropdown').click()
        cy.get('#acm-kui-dropdown #terminal-dropdown-content li').should('be.visible').and('have.length', 2).then((c) => {
            cy.wrap(c).get('#new-tab-terminal a').should('have.prop', 'href', Cypress.config().baseUrl + '/kui').and('have.attr', 'target').and('match', /_blank/)
            cy.wrap(c).get('#current-tab-terminal').click()
            cy.get('.bx--header__name').should('contain', 'Visual Web Terminal')
        })
    },
    openInfo: () => {
        cy.get('#acm-info-dropdown #info-dropdown-content li').should('not.be.visible')
        cy.get('.navigation-container #acm-info-dropdown').click()
        cy.get('#acm-info-dropdown #info-dropdown-content li').should('be.visible').and('have.length', 2).then((c) => {
            cy.getCookie('acm-access-token-cookie').should('exist').then((token, c) => {
                acmVersion(token.value).then((version) => {
                    cy.wrap(c).get('#acm-doc a').should('have.prop', 'href',
                        'https://access.redhat.com/documentation/en-us/red_hat_advanced_cluster_management_for_kubernetes/' + version.match(/[0-9]+\.[0-9]+/) + '/')
                    cy.wrap(c).get('#acm-about').click()
                    cy.get('.bx--modal-container').should('contain', version).get('.bx--modal-close').click()
                    cy.get('.bx--modal-container').should('not.exist')
                })
            })
        })
    },
    openUser: () => {
        cy.get('.navigation-container #acm-user-dropdown').click()
        cy.getCookie('acm-access-token-cookie').should('exist').then((token) => {
            oauthTokenEndpoint(token.value).then((endpoint) => {
                cy.get('#acm-user-dropdown #acm-user-dropdown-content li').should('be.visible').and('have.length', 2)
                    .get('#configure-client a').should('have.prop', 'href', endpoint + '/request').and('have.attr', 'target').and('match', /_blank/)
            })
        })
        cy.get('.navigation-container #acm-user-dropdown').click()
        cy.get('#acm-user-dropdown #acm-user-dropdown-content li').should('be.not.visible')
    }
}