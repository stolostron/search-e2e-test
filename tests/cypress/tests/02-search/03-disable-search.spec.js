/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import {tags} from '../../config'
import {searchBar, searchPage} from '../../views/search'
import {podDetailPage} from "../../views/podDetailPage";
import {cliHelper} from "../../scripts/cliHelper";

// Under progress
describe('Search: Test "Search" disability function', {tags: tags.component}, function () {
    before(() => {
        // Get name of an imported cluster
        cliHelper.getTargetManagedCluster().as('managedCluster')
        if (this.managedCluster === 'local-cluster'){
            Cypress.on('fail - No managed cluster found', (error, runnable) => { throw error; });
        }
    })

    it(`RHACM4K-3941: Search function can be disabled on the managed cluster`, {tags: ['@RHACM4K-3941', '@post-release']}, function () {
        /* Verify search-collector can be found on Add-ons page*/
        /* Disable search-collector/
        // Get klusterletaddonconfigs file for a managed cluster
        // Create a temp yaml file and update the flag
        // Apply the enw yaml file to make the changes - oc set resources -f kluster_addon.yaml
        /* Verify search-collector is not found on Add-ons page*/
        /*Enable search-collector*/
        /* Verify search-collector can be found on Add-ons page*/
    })
})


