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
const getKubeToken = require('../scripts/helpers')
require('cypress-terminal-report/src/installLogsCollector')()

Cypress.Cookies.defaults({
  whitelist: ['acm-access-token-cookie', '_oauth_proxy', 'XSRF-TOKEN', '_csrf']
})

let kubeToken = null;
const timestamp = Date.now()
const namespaceName = `e2e-test-${timestamp}`
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0'

console.log('Creating resources for this execution using the unique ID: ', timestamp)

before(async () => {
  kubeToken = await getKubeToken()
  let addedRbacProvider = false
  console.log('kubetoken', kubeToken)

  // Clean up any existing test resources
  const namespaces = await cy.kubeRequest(
    '/api/v1/namespaces',
    'get',
    {},
    kubeToken
  )
  namespaces.items.forEach( async items => {
    if(items.metadata.name.includes('e2e-test')){
      kubeRequest(
        `api/v1/namespaces/${namespace}`,
        'delete',
        {},
        kubeToken
      )
    }
  })

  // Check if user password secret exists. If not, create it.
  const userSecretCheck = await cy.exec(`oc get secret search-e2e-secret -n openshift-config`)
  if (userSecretCheck.includes('Command failed') || userSecretCheck.includes('Error')) {
    console.log('Creating Oauth Provider secret')
    await cy.exec(`oc create secret generic search-e2e-secret --from-file=htpasswd=./tests/utils/kube-resources/passwdfile -n openshift-config`)
    console.log('Success: Created Oauth Provider secret')
    addedRbacProvider = true
  }

  // Check if cluster OAuth resource has the e2e testing identity provider, if not add it.
  const oauthCheck = await cy.kubeRequest(`/apis/config.openshift.io/v1/oauths/cluster`, 'get', {}, kubeToken)
  if (oauthCheck && !oauthCheck.spec.identityProviders) {
    console.log('Adding e2e identity provider')
    await cy.exec(`oc patch OAuth cluster --type='json' -p='[{"op": "add", "path": "/spec", "value": {"identityProviders":[{"htpasswd":{"fileData":{"name":"search-e2e-secret"}},"mappingMethod":"claim","name":"search-e2e","type": "HTPasswd"}]}}]'`)
    console.log('Success: Adding e2e identity provider')
    addedRbacProvider = true
  } else if (oauthCheck && oauthCheck.spec.identityProviders.findIndex(provider => provider.name === 'search-e2e') === -1) {
    console.log('Adding e2e identity provider')
    await cy.exec(`oc patch OAuth cluster --type='json' -p='[{"op": "add", "path": "/spec/identityProviders/-", "value": {"htpasswd":{"fileData":{"name":"search-e2e-secret"}},"mappingMethod":"claim","name":"search-e2e","type": "HTPasswd"}}]'`)
    console.log('Success: Adding e2e identity provider')
    addedRbacProvider = true
  }

  // Check if viewer ClusterRole exists, if not create it.
  const roleCheck = await cy.exec(`oc get clusterrole view`)
  if (roleCheck.includes('Command failed') || roleCheck.includes('Error')) {
    console.log('Creating cluster role - viewer')
    await cy.exec(`oc apply -f ./tests/utils/kube-resources/viewer-role.yaml`)
    console.log('Success: Creating cluster role - viewer')
    addedRbacProvider = true
  }

  // Check if viewer ClusterRoleBinding exists, if not create it.
  const roleBindingCheck = await cy.exec(`oc get clusterrolebinding viewer-binding`)
  if (roleBindingCheck.includes('Command failed') || roleBindingCheck.includes('Error')) {
    console.log('Creating cluster role binding - viewer')
    await cy.exec(`oc apply -f ./tests/utils/kube-resources/viewer-roleBinding.yaml`)
    console.log('Success: Creating cluster role binding- viewer')
    addedRbacProvider = true
  } else {
    const viewerBinding = await cy.kubeRequest(`/apis/rbac.authorization.k8s.io/v1/clusterrolebindings/viewer-binding`, 'get', {}, kubeToken)
    if (!viewerBinding.subjects || viewerBinding.subjects.findIndex(subject => subject.name === 'user-viewer') === -1) {
      viewerBinding.subjects = [
        {
          "kind": "User",
          "apiGroup": "rbac.authorization.k8s.io",
          "name": "user-viewer"
        },
        ...viewerBinding.subjects || []
      ]
      await cy.kubeRequest(`/apis/rbac.authorization.k8s.io/v1/clusterrolebindings/viewer-binding`, 'put', viewerBinding, kubeToken)
      console.log('Success: Adding new user to role binding')
      addedRbacProvider = true
    }
  }

  // Need to pause after Rbac creation so resources are able to be used.
  if (addedRbacProvider){
    cy.sleep(30000)
  }

  // Create test namespace
  await cy.kubeRequest(
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
    kubeToken
  )
  console.log('Success: Created test namespace')
  
  // create secret on test namespace
  await cy.kubeRequest(
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
    kubeToken
  )
  console.log('Success: Created test secret')

  // create configmap on test namespace
  await cy.kubeRequest(
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
    kubeToken
  )
  console.log('Success: Created test configmap')
  console.log('Waiting 60 seconds to ensure that any existing RBAC cache gets invalidated after the new namespace is detected.')
  cy.sleep(60000)
  done();

})