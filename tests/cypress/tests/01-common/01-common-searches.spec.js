/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import {squad, tags} from '../../config'
import {cliHelper} from '../../scripts/cliHelper'
import {searchPage} from '../../views/search'

const postfix = Date.now()
const appName = `auto-test-app-${postfix}`

const namespace = cliHelper.generateNamespace()

describe('RHACM4K-913: Search: common filter and conditions', {tags: ['@RHACM4K-913']}, function () {
    it(`RHACM4K-913: Search: should create namespace and application`, function () {
        cliHelper.createNamespace(namespace)
        cliHelper.createApplication(appName, namespace)
    })

    it(`RHACM4K-913: Search: Should login`, function () {
        cy.login()
    })

    beforeEach(function () {
        searchPage.whenGoToSearchPage()
    })

    it(`RHACM4K-913: Search: Should find expected application and delete application`, function () {
        searchPage.shouldFindApplicationInNS(appName, namespace)
        searchPage.shouldDeleteApplicationInNS(appName, namespace)
        cliHelper.deleteNamespace(namespace)
    })

})
