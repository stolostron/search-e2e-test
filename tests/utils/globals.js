/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

const { request, getAccessToken, getKubeToken, kubeRequest } = require('../utils/requestClient')

let accessToken = null;
let kubeToken = null;
const namespaceName = `e2e-test-${Date.now()}`
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0'

/* eslint-disable no-console*/
module.exports = {

  // External before hook is ran at the beginning of the tests run, before creating the Selenium session
  before: async function(done) {
    await getAccessToken().then(res => accessToken = res);
    await getKubeToken(accessToken).then(res => kubeToken = res);
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

    // Setup LDAP:
    // Create LDAP connection if not present
    await request('/idmgmt/identity/api/v1/directory/ldap/list', 'get', {}, accessToken).then(async (res) => {
      if (res && res.filter(i => i.LDAP_ID === 'Bluepages-e2e-testing').length === 0) {
        await request(
          '/idmgmt/identity/api/v1/directory/ldap/onboardDirectory',
          'post',
          {
            "LDAP_ID": "Bluepages-e2e-testing",
            "LDAP_URL": "ldap://bluepages.ibm.com:389",
            "LDAP_BASEDN": "o=ibm.com",
            "LDAP_BINDDN": "",
            "LDAP_BINDPASSWORD": "",
            "LDAP_TYPE": "IBM Tivoli Directory Server",
            "LDAP_USERFILTER": "(&(emailAddress=%v)(objectclass=person))",
            "LDAP_GROUPFILTER": "(&(cn=%v)(objectclass=groupOfUniqueNames))",
            "LDAP_USERIDMAP": "*:emailAddress",
            "LDAP_GROUPIDMAP": "*:cn",
            "LDAP_GROUPMEMBERIDMAP": "groupOfUniqueNames:uniquemember"
          },
          accessToken
        )
        console.log('Success: Created LDAP connection')
        // Create Team
        await request(
          '/idmgmt/identity/api/v1/teams',
          'post',
          {
            "teamId":"e2e-test-team",
            "name":"e2e-test-team",
            "users":[],
            "usergroups":[],
            "serviceids":[]
          },
          accessToken
        ).then(async () => {
          console.log('Success: Added team to LDAP')
          // Add mcmdev user as Viewer
          await request(
            '/idmgmt/identity/api/v1/teams/e2e-test-team',
            'put',
            {
              "teamId": "e2e-test-team",
              "name": "e2e-test-team",
              "users": [{
                "userId": process.env.CLUSTER_VIEWER_USR,
                "firstName": "Test",
                "lastName": "User",
                "roles": [{
                  "id": "crn:v1:icp:private:iam::::role:Viewer"
                }]
              }],
              "usergroups":[],
              "serviceids":[]
            },
            accessToken
          )
          console.log('Success: Added mcmdev user to team as Viewer')
          // Add custom namespace to team resources
          await request(
            '/idmgmt/identity/api/v1/teams/e2e-test-team/resources',
            'post',
            {
              "crn": `crn:v1:icp:private:k8:mycluster:n/${namespaceName}:::`
            },
            accessToken
          )
          console.log(`Success: Added ${namespaceName} to resources`)
        })
      } else {
        console.log('LDAP already exists, skipping this step')
      }
    })

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

    // Remove LDAP user
    await request(
      '/idmgmt/identity/api/v1/teams/e2e-test-team',
      'put',
      {
        "teamId": "e2e-test-team",
        "name": "e2e-test-team",
        "users": [],
        "usergroups": [],
        "serviceids": [],
      },
      accessToken
    )
    console.log('Success: Removed LDAP user')
    // Remove LDAP resources
    await request(
      '/idmgmt/identity/api/v1/teams/e2e-test-team/resources',
      'delete',
      {
        "crns": [{
          "crn": `crn:v1:icp:private:k8:mycluster:n/${namespaceName}:::`
        }]
      },
      accessToken
    )
    console.log('Success: Removed LDAP resources')

    // Remove LDAP team
    await request(
      '/idmgmt/identity/api/v1/teams/e2e-test-team',
      'delete',
      { },
      accessToken
    )
    console.log('Success: Removed LDAP team')

    // Removed LDAP connection
    await request(
      '/idmgmt/identity/api/v1/directory/ldap/offboardDirectory',
      'post',
      {
        "LDAP_ID": "Bluepages-e2e-testing"
      },
      accessToken
    )
    console.log('Success: Removed LDAP connection')
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
