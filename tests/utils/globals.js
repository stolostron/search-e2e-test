/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.

const fs = require('fs');
const config = require('../../config');
const execCLI = require('./cliHelper');
const getKubeToken = require('./tokenHelper');
const { kubeRequest } = require('./requestClient');

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

    //TODO see if using a kustomization.yaml will work here instead of multiple kube applies
    // Create secret with user passwords
    await execCLI(`kubectl create secret generic e2e-test-secret --from-file=htpasswd=./tests/utils/kube-resources/passwdfile -n ${namespaceName}`)

    // Create the test Oauth
    await execCLI(`kubectl patch OAuth cluster --type='json' -p='[{"op": "add", "path": "/spec/identityProviders/-", "value": {"htpasswd":{"fileData":{"name":"e2e-test-secret"}},"mappingMethod":"claim","name":"e2e-testing","type": "HTPasswd"}}]'`)
    // await execCLI(`kubectl apply -f ./tests/utils/kube-resources/OAuth.yaml`)

    // Create the viewer user (might be created when the user logs in?)
    // validation is off so we dont have to specify a user group
    // await execCLI(`kubectl apply -f ./tests/utils/kube-resources/new-user.yaml --validate=false`)

    // Create the role & roleBinding for viewer
    // await execCLI(`kubectl apply -f ./tests/utils/kube-resources/viewer-role.yaml`)
    // await execCLI(`kubectl apply -f ./tests/utils/kube-resources/viewer-binding.yaml`)


    done();
  },

  // External after hook is run at the very end of the tests run, after closing the Selenium session
  after: async function(done) {
    // Remove the test Oauth
    // await execCLI(`kubectl apply -f ./tests/utils/kube-resources/OAuth.yaml`)

    // Remove the viewer user

    // Remove the role & roleBinding for viewer

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
