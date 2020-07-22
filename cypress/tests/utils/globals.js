/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.

/* const getKubeToken = require('./tokenHelper');
const { kubeRequest } = require('./requestClient');

let kubeToken = null // 'GHDzpdI7asfvcAtfMMr1cyBsc0dZudCOKsPM26tz1-8'
const timestamp = Date.now()
const namespaceName = `e2e-test-${timestamp}`
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0'

Cypress.Cookies.defaults({
  whitelist: ['acm-access-token-cookie', '_oauth_proxy', 'XSRF-TOKEN', '_csrf']
})

const sleep = (milliseconds) => {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds)
}

console.log('Creating resources for this execution using the unique ID: ', timestamp)

/* eslint-disable no-console*/
/* module.exports = {
  // External before hook is run at the beginning of the tests run, before creating the Selenium session
  before: async function(done) {
    kubeToken = await getKubeToken()
    let addedRbacProvider = false

    // Check if user password secret exists, if not create it.
    cy.exec(`oc get secret search-e2e-secret -n openshift-config`, { timeout: 10000 }).then((res) => {
      const userSecretCheck = res.stdout
      console.log('userSecretCheck', userSecretCheck)
      if (userSecretCheck.includes('Command failed') || userSecretCheck.includes('Error')) {
        console.log('Creating Oauth Provider secret')
        cy.exec(`oc create secret generic search-e2e-secret --from-file=htpasswd=./tests/utils/kube-resources/passwdfile -n openshift-config`, { timeout: 10000 })
        console.log('Success: Created Oauth Provider secret')
        addedRbacProvider = true
      }
    })

    console.log('token', kubeToken)
  
    // Check if cluster OAuth resource has the e2e testing identity provider, if not add it.
    const oauthCheck = await kubeRequest(`/apis/config.openshift.io/v1/oauths/cluster`, 'get', {}, kubeToken)
    if (oauthCheck && !oauthCheck.spec.identityProviders) {
      console.log('Adding e2e identity provider')
      await cy.exec(`oc patch OAuth cluster --type='json' -p='[{"op": "add", "path": "/spec", "value": {"identityProviders":[{"htpasswd":{"fileData":{"name":"search-e2e-secret"}},"mappingMethod":"claim","name":"search-e2e","type": "HTPasswd"}]}}]'`).then((res) => {
        console.log('Success: Adding e2e identity provider')
        addedRbacProvider = true
      })
    } else if (oauthCheck && oauthCheck.spec.identityProviders.findIndex(provider => provider.name === 'search-e2e') === -1) {
      console.log('Adding e2e identity provider')
      await cy.exec(`oc patch OAuth cluster --type='json' -p='[{"op": "add", "path": "/spec/identityProviders/-", "value": {"htpasswd":{"fileData":{"name":"search-e2e-secret"}},"mappingMethod":"claim","name":"search-e2e","type": "HTPasswd"}}]'`).then((res) => {
        console.log('Success: Adding e2e identity provider')
        addedRbacProvider = true
      })
    }

    // Check if viewer ClusterRole exists, if not create it.
    await cy.exec(`oc get clusterrole view`).then(async (res) => {
      const roleCheck = res.stdout
      if (roleCheck.includes('Command failed') || roleCheck.includes('Error')) {
        console.log('Creating cluster role - viewer')
        await cy.exec(`oc apply -f ./tests/utils/kube-resources/viewer-role.yaml`).then((res) => {
          console.log('Success: Creating cluster role - viewer')
          addedRbacProvider = true
        })
      }
    })

    // Check if viewer ClusterRoleBinding exists, if not create it.
    await cy.exec(`oc get clusterrolebinding viewer-binding`).then(async (res) => {
      const roleBindingCheck = res.stdout
      if (roleBindingCheck.includes('Command failed') || roleBindingCheck.includes('Error')) {
        console.log('Creating cluster role binding - viewer')
        await cy.exec(`oc apply -f ./tests/utils/kube-resources/viewer-roleBinding.yaml`).then((res) => {
          console.log('Success: Creating cluster role binding- viewer')
          addedRbacProvider = true
        })
      } else {
        if (await process.env.SERVICEACCT_TOKEN) {
          const viewerBinding = await kubeRequest(`/apis/rbac.authorization.k8s.io/v1/clusterrolebindings/viewer-binding`, 'get', {}, process.env.SERVICEACCT_TOKEN)//kubeToken)
          if (!viewerBinding.subjects || viewerBinding.subjects.findIndex(subject => subject.name === 'user-viewer') === -1) {
            viewerBinding.subjects = [
              {
                "kind": "User",
                "apiGroup": "rbac.authorization.k8s.io",
                "name": "user-viewer"
              },
              ...viewerBinding.subjects || []
            ]
            await kubeRequest(`/apis/rbac.authorization.k8s.io/v1/clusterrolebindings/viewer-binding`, 'put', viewerBinding, process.env.SERVICEACCT_TOKEN)//kubeToken)
            console.log('Success: Adding new user to role binding')
            addedRbacProvider = true
          }
        }
      }
    })
  
    // Need to pause after Rbac creation so resources are able to be used.
    if (addedRbacProvider){
      sleep(30000)
    }

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
          },
        }
      },
      process.env.SERVICEACCT_TOKEN // kubeToken
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
          "name": `my-test-secret-${timestamp}`
        },
        "type": "Opaque",
        "data": {
          "username": "YWRtaW4="
        }
      },
      process.env.SERVICEACCT_TOKEN //kubeToken
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
          "name": `my-test-config-${timestamp}`,
          "namespace": `${namespaceName}`
        },
      },
      process.env.SERVICEACCT_TOKEN // kubeToken
    )
    console.log('Success: Created test configmap')
    console.log('Waiting 60 seconds to ensure that any existing RBAC cache gets invalidated after the new namespace is detected.')
    sleep(60000)
    done()
  },

  // External after hook is run at the very end of the tests run, after closing the Selenium session
  after: async function(done) {

    // Remove test namespace & resources (Keep the Oauth provider & users)
    await kubeRequest(
      `/api/v1/namespaces/${namespaceName}`,
      'delete',
      {},
      process.env.SERVICEACCT_TOKEN // kubeToken
    )
    sleep(30000)
    await kubeRequest(
      `/api/v1/namespaces/${namespaceName}`,
      'patch',
      [{
        "op": "replace",
        "path":"spec/finalizers",
        "value":"[]"
      }],
      process.env.SERVICEACCT_TOKEN // kubeToken
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
} */
