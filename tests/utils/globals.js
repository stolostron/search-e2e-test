/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.

const getKubeToken = require('./tokenHelper')
const { kubeRequest } = require('../utils/requestClient')
const config = require('../../config');

let accessToken = null;
let kubeToken = null;
const namespaceName = `e2e-test-${Date.now()}`
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0'

/* eslint-disable no-console*/
module.exports = {
  // External before hook is ran at the beginning of the tests run, before creating the Selenium session
  before: async function(done) {
    kubeToken = await getKubeToken();
    
    // Create test namespace
    await kubeRequest(
      '/api/v1/namespaces',
      'post',
      {
        "apiVersion": "v1",
        "kind": "Namespace",
        "metadata": {
          "name": namespaceName,
          "labels": {
            "name": "Namespace-4-e2e-testing"
          }
        }
      },
      kubeToken
    )
    console.log('Success: Created test namespace')
    
    // create secret on test namespace
    await kubeRequest(
      `/api/v1/namespaces/${namespaceName}/secrets`,
      'post',
      {
        "apiVersion": "v1",
        "kind": "Secret",
        "metadata": {
          "name": "my-test-secret"
        },
        "type": "Opaque",
        "data": {
          "username": "YWRtaW4="
        }
      },
      kubeToken
    )
    console.log('Success: Created test secret')

    // create configmap on test namespace
    await kubeRequest(
      `/api/v1/namespaces/${namespaceName}/configmaps`,
      'post',
      {
        "apiVersion": "v1",
        "kind": "ConfigMap",
        "metadata": {
          "name": "my-test-config",
          "namespace": `${namespaceName}`
        },
      },
      kubeToken
    )
    console.log('Success: Created test configmap')

    done();
  },

  // External after hook is ran at the very end of the tests run, after closing the Selenium session
  after: async function(done) {
    // Remove test namespace
    await kubeRequest(
      `/api/v1/namespaces/${namespaceName}`,
      'delete',
      {},
      kubeToken
    )
    console.log('Success: Removing test namespace')

    done()
  },

  // This will be run before each test suite is started
  beforeEach: function(browser, done) {
    done()
  },

  // This will be run after each test suite is finished
  afterEach: function(browser, done) {
    done()
  }
}
