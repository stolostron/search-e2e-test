/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />
import { clusterNamespace } from "../views/clusterNamespaceSearch"
import { squad } from "../config"

const queryDefaultNamespaceName = "default namespace search"
const queryDefaultNamespaceDesc = "this is searching that each cluster should have default namespace"

const queryOcmaNamespaceName = "open-cluster-management-agent search"
const queryOcmaNamespaceDesc = "this is searching that each cluster should have open-cluster-management-agent"

describe("Search: Saved searches", function(){

  before(function() {
    cy.login()
  })

  after(function() {
    clusterNamespace.whenDeleteSavedSearch(queryDefaultNamespaceName)
    clusterNamespace.whenDeleteSavedSearch(queryOcmaNamespaceName)
    cy.logout()
  })

  it(`[P2][Sev2][${squad}] should find each managed cluster has default namespace`, function() {
    clusterNamespace.validateClusterNamespace({"namespace": "default"}, "")
  })

  it(`[P2][Sev2][${squad}] should find open-cluster-management-agent namespace exists`, function() {
    clusterNamespace.validateClusterNamespace({"kind": "namespace","name" : "open-cluster-management-agent" }, "has_local-cluster")
  })

  it(`[P2][Sev2][${squad}] should be able to save current search`, function(){
    clusterNamespace.saveClusterNamespaceSearch({"namespace": "default" }, queryDefaultNamespaceName, queryDefaultNamespaceDesc)
    clusterNamespace.saveClusterNamespaceSearch({"kind": "namespace","name" : "open-cluster-management-agent" }, queryOcmaNamespaceName, queryOcmaNamespaceDesc)
  })

  it(`[P2][Sev2][${squad}] should be able to find the saved searches`, function() {
    clusterNamespace.getSavedSearch(queryDefaultNamespaceName)
    clusterNamespace.getSavedSearch(queryOcmaNamespaceName)
  })
})
