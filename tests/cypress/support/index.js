/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import './commands'
import {cliHelper} from '../scripts/cliHelper'

require('cypress-terminal-report/src/installLogsCollector')()
require('cypress-grep')()

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
var timeoutID

const err = 'Test taking too long! It has been running for 5 minutes.'

// https://multicloud-console.apps.ocp4-aws-3.dev09.red-chesterfield.com/

const baseDomain = Cypress.env("BASE_URL").replace("https://multicloud-console.apps.", "")
Cypress.env('CYPRESS_OPTIONS_HUB_BASEDOMAIN', baseDomain)


before(() => {
    // Log into cluster with oc command.
    cliHelper.login('Local')

    // This is needed for search to deploy RedisGraph upstream. Without this search won't be operational.
    cy.exec(`oc get mch -A -o jsonpath='{.items[0].metadata.namespace}'`, {
        failOnNonZeroExit: false,
    }).then((res) => {
        var namespace = res.stdout

        cy.exec(
            `oc get srcho searchoperator -o jsonpath="{.status.deployredisgraph}" -n ${namespace}`,
            {failOnNonZeroExit: false}
        ).then((result) => {
            if (result.stdout == 'true') {
                cy.task('log', 'Redisgraph deployment is enabled.')
            } else {
                cy.task(
                    'log',
                    'Redisgraph deployment disabled, enabling and waiting 10 seconds for the search-redisgraph-0 pod.'
                )
                cy.exec(
                    `oc set env deploy search-operator DEPLOY_REDISGRAPH="true" -n ${namespace}`
                )
                return cy.wait(10 * 1000)
            }
        })
        cy.clearCookies()
    })
})

beforeEach(() => {
    Cypress.Cookies.preserveOnce(
        'acm-access-token-cookie',
        '_oauth_proxy',
        'XSRF-TOKEN',
        '_csrf'
    )
    timeoutID = setTimeout(() => {
        console.error(err)
        throw Error(err)
    }, 60000 * 5)
})

afterEach(() => {
    clearTimeout(timeoutID)
})
