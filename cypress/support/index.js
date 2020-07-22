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
require('cypress-terminal-report/src/installLogsCollector')()

Cypress.Cookies.preserveOnce('acm-access-token-cookie', '_oauth_proxy', 'XSRF-TOKEN', '_csrf')

let kubeToken = null;
export const timestamp = Date.now()
const namespaceName = `e2e-test-${timestamp}`
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0'

console.log('Creating resources for this execution using the unique ID: ', timestamp)

before(() => {
  cy.clearCookies('acm-access-token-cookie')
  let addedRbacProvider = false
  cy.exec('oc whoami -t', {failOnNonZeroExit: false})
    .then(res => {
      cy.setCookie('acm-access-token-cookie', res.stdout)
      kubeToken = res.stdout

      // Check if user password secret exists. If not, create it.
      cy.exec(`oc get secret search-e2e-secret -n openshift-config`).then(res => {
        const userSecretCheck = res.stdout
        if (userSecretCheck.includes('Command failed') || userSecretCheck.includes('Error')) {
          console.log('Creating Oauth Provider secret')
          cy.exec(`oc create secret generic search-e2e-secret --from-file=htpasswd=../fixtures/passwdfile -n openshift-config`)
          console.log('Success: Created Oauth Provider secret')
          addedRbacProvider = true
        } else {
          console.log('search-e2e-secret already exists')
        }
      })

      // Check if cluster OAuth resource has the e2e testing identity provider, if not add it.
      cy.kubeRequest(`/apis/config.openshift.io/v1/oauths/cluster`, 'get', {}, kubeToken).then(res => {
        const oauthCheck = res
        if (oauthCheck && !oauthCheck.spec.identityProviders) {
          console.log('Adding e2e identity provider')
          cy.exec(`oc patch OAuth cluster --type='json' -p='[{"op": "add", "path": "/spec", "value": {"identityProviders":[{"htpasswd":{"fileData":{"name":"search-e2e-secret"}},"mappingMethod":"claim","name":"search-e2e","type": "HTPasswd"}]}}]'`)
          console.log('Success: Adding e2e identity provider')
          addedRbacProvider = true
        } else if (oauthCheck && oauthCheck.spec.identityProviders.findIndex(provider => provider.name === 'search-e2e') === -1) {
          console.log('Adding e2e identity provider')
          cy.exec(`oc patch OAuth cluster --type='json' -p='[{"op": "add", "path": "/spec/identityProviders/-", "value": {"htpasswd":{"fileData":{"name":"search-e2e-secret"}},"mappingMethod":"claim","name":"search-e2e","type": "HTPasswd"}}]'`)
          console.log('Success: Adding e2e identity provider')
          addedRbacProvider = true
        }
      })

        // Check if viewer ClusterRole exists, if not create it.
      cy.exec(`oc get clusterrole view`).then(res => {
        const roleCheck = res.stdout
        if (roleCheck.includes('Command failed') || roleCheck.includes('Error')) {
          console.log('Creating cluster role - viewer')
          cy.exec(`oc apply -f ../fixtures/viewer-role.yaml`)
          console.log('Success: Creating cluster role - viewer')
          addedRbacProvider = true
        }
      })


        // Check if viewer ClusterRoleBinding exists, if not create it.
        cy.exec(`oc get clusterrolebinding viewer-binding`).then((res) => {
          const roleBindingCheck = res.stdout
          if ((res.stderr.includes('Command failed') || res.stderr.includes('Error')) || roleBindingCheck.includes('Command failed') || roleBindingCheck.includes('Error')) {
            console.log('Creating cluster role binding - viewer')
            cy.exec(`oc apply -f ../fixtures/viewer-roleBinding.yaml`).then(() => {
              console.log('Success: Creating cluster role binding- viewer')
              addedRbacProvider = true
            })
          } else {
            cy.kubeRequest(`/apis/rbac.authorization.k8s.io/v1/clusterrolebindings/viewer-binding`, 'get', {}, kubeToken).then((res) => {
              const viewerBinding = res
              if (!viewerBinding.subjects || viewerBinding.subjects.findIndex(subject => subject.name === 'user-viewer') === -1) {
                viewerBinding.subjects = [
                  {
                    "kind": "User",
                    "apiGroup": "rbac.authorization.k8s.io",
                    "name": "user-viewer"
                  },
                  ...viewerBinding.subjects || []
                ]
                cy.kubeRequest(`/apis/rbac.authorization.k8s.io/v1/clusterrolebindings/viewer-binding`, 'put', viewerBinding, kubeToken)
                console.log('Success: Adding new user to role binding')
                addedRbacProvider = true
              }
            })
           }
         })
        }).then(() => {
          // Need to pause after Rbac creation so resources are able to be used.
          if (addedRbacProvider) {
            cy.log('Pausing after Rbac creation to ensure that resources are able to be used.')
            // cy.wait(30000)
          } else {
            cy.log('Preparing to create test resources')
          }


      // Create test namespace
      cy.kubeRequest(
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
      ).then(() => console.log('Success: Created test namespace'))
      
      // create secret on test namespace
      cy.kubeRequest(
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
      ).then(() => console.log('Success: Created test secret'))

      // create configmap on test namespace
      cy.kubeRequest(
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
      ).then(() => {
        console.log('Success: Created test configmap')
        console.log('Waiting 60 seconds to ensure that any existing RBAC cache gets invalidated after the new namespace is detected.')
        // cy.wait(60000)
      })
    })


  after(done => {
    // Remove test namespace & resources (Keep the Oauth provider & users)
    cy.kubeRequest(
      `/api/v1/namespaces/${namespaceName}`,
      'delete',
      {},
      kubeToken
    )
    // cy.wait(60000)

    cy.kubeRequest(`/api/v1/namespaces`, 'get', {}, kubeToken).then(res => {
      const namespaces = res
      if (namespaces && namespaces.items && namespaces.items.find(ns => ns.metadata.name)) {
        console.log(`Namespace ${namespaceName} was not deleted within 60 seconds. Removing finalizers to force delete.`)
        cy.kubeRequest(
          `/api/v1/namespaces/${namespaceName}`,
          'patch',
          [{
            "op": "replace",
            "path":"spec/finalizers",
            "value":"[]"
          }],
          kubeToken
        ).catch((e) => console.log(`Unable to force delete of namespace ${namespaceName}.   This happened on the cleanup phase and should not affect the test result.`))
      }
    })
    console.log('Success: Removing test namespace')
    done()
  })
})