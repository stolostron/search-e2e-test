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

// Import commands.js using ES2015 syntax:
import './commands'

const { kubeRequest } = require('../tests/utils/requestClient')
Cypress.Cookies.preserveOnce('acm-access-token-cookie', '_oauth_proxy', 'XSRF-TOKEN', '_csrf')

let kubeToken = null
const timestamp = Date.now()
const namespaceName = `e2e-test-${timestamp}`
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0'
  
console.log('Creating resources for this execution using the unique ID: ', timestamp)

before(() => {
  let addedRbacProvider = false

  cy.exec(`oc login -u ${Cypress.env('user')} -p ${Cypress.env('password')} --server=https://api.${Cypress.env('baseDomain')}:6443 --insecure-skip-tls-verify=true`).then(() => {
    cy.exec('oc whoami -t').then((res) => {
      cy.setCookie('acm-access-token-cookie', res.stdout).then((cookie) => {
        kubeToken = cookie.value

        cy.exec(`oc get secret search-e2e-secret -n openshift-config`).then((res) => {
          const userSecretCheck = res.stdout
          if (userSecretCheck.includes('Command failed') || userSecretCheck.includes('Error')) {
            console.log('Creating Oauth Provider secret')
            cy.exec(`oc create secret generic search-e2e-secret --from-file=htpasswd=./tests/utils/kube-resources/passwdfile -n openshift-config`, { timeout: 10000 })
            console.log('Success: Created Oauth Provider secret')
            addedRbacProvider = true
          }
        })

        /**
         * TODO: kubeRequest doesn't allow cy.exec, we need to find a way to get the ouathCheck for the patch command
         */
        kubeRequest(`/apis/config.openshift.io/v1/oauths/cluster`, 'get', {}, kubeToken).then((res) => {
          const oauthCheck = res
          if (oauthCheck && !oauthCheck.spec.identityProviders) {
            console.log('Adding e2e identity provider')
            // cy.exec(`oc patch OAuth cluster --type='json' -p='[{"op": "add", "path": "/spec", "value": {"identityProviders":[{"htpasswd":{"fileData":{"name":"search-e2e-secret"}},"mappingMethod":"claim","name":"search-e2e","type": "HTPasswd"}]}}]'`).then(() => {
              console.log('Success: Adding e2e identity provider')
              addedRbacProvider = true
            // })
          } else if (oauthCheck && oauthCheck.spec.identityProviders.findIndex(provider => provider.name === 'search-e2e') === -1) {
            console.log('Adding e2e identity provider')
            // cy.exec(`oc patch OAuth cluster --type='json' -p='[{"op": "add", "path": "/spec/identityProviders/-", "value": {"htpasswd":{"fileData":{"name":"search-e2e-secret"}},"mappingMethod":"claim","name":"search-e2e","type": "HTPasswd"}}]'`).then(() => {
              console.log('Success: Adding e2e identity provider')
              addedRbacProvider = true
            // })
          }
        })

        // Check if viewer ClusterRole exists, if not create it.
        cy.exec(`oc get clusterrole view`).then((res) => {
          const roleCheck = res.stdout
          if ((res.stderr.includes('Command failed') || res.stderr.includes('Error')) || (roleCheck.includes('Command failed') || (roleCheck.includes('Error')))) {
            console.log('Creating cluster role - viewer')
            cy.exec(`oc apply -f ./tests/utils/kube-resources/viewer-role.yaml`).then(() => {
              console.log('Success: Creating cluster role - viewer')
              addedRbacProvider = true
            })
          }
        })

        // Check if viewer ClusterRoleBinding exists, if not create it.
        cy.exec(`oc get clusterrolebinding viewer-binding`).then((res) => {
          const roleBindingCheck = res.stdout
          if ((res.stderr.includes('Command failed') || res.stderr.includes('Error')) || roleBindingCheck.includes('Command failed') || roleBindingCheck.includes('Error')) {
            console.log('Creating cluster role binding - viewer')
            cy.exec(`oc apply -f ./tests/utils/kube-resources/viewer-roleBinding.yaml`).then(() => {
              console.log('Success: Creating cluster role binding- viewer')
              addedRbacProvider = true
            })
          } else {
            kubeRequest(`/apis/rbac.authorization.k8s.io/v1/clusterrolebindings/viewer-binding`, 'get', {}, kubeToken).then((res) => {
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
                kubeRequest(`/apis/rbac.authorization.k8s.io/v1/clusterrolebindings/viewer-binding`, 'put', viewerBinding, kubeToken)
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
            cy.wait(30000)
          } else {
            cy.log('Preparing to create test resources')
          }
          
          // Create test namespace
          kubeRequest(
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
          ).then(() => { console.log('Success: Created test namespace') })

          // create secret on test namespace
          kubeRequest(
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
          ).then(() => { console.log('Success: Created test secret') })

          // create configmap on test namespace
          kubeRequest(
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
        ).then(() => { console.log('Success: Created test configmap') })
        
        cy.log('Waiting 60 seconds to ensure that any existing RBAC cache gets invalidated after the new namespace is detected.')
        cy.wait(60000).end()
      })
    })
  })
})

after(() => {
  // Remove test namespace & resources (Keep the Oauth provider & users)
  kubeRequest(
    `/api/v1/namespaces/${namespaceName}`,
    'delete',
    {},
    kubeToken
  )

  cy.wait(30000).then(() => {
    kubeRequest(
      `/api/v1/namespaces/${namespaceName}`,
      'patch',
        [{
          "op": "replace",
          "path":"spec/finalizers",
          "value":"[]"
        }],
      kubeToken
    ).then(() => { console.log('Success: Removing test namespace').end() })
  })
})