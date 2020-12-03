/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />
import { searchPage, searchBar } from '../views/search'
import { clusterNamespace } from '../views/clusterNamespaceSearch'

const quaryDefaultNamespaceName = "default namespace search"
const quaryDefaultNamespaceDesc = "this is searching that each cluser should have default namespace"

const quaryOcmaNamespaceName = "open-cluster-management-agent search"
const quaryOcmaNamespaceDesc = "this is searching that each cluser should have open-cluster-management-agent"

describe('Search and validate all clusters have default namespace', function(){

  before(function() {
    cy.login()
  })

  after(function() {
    cy.logout()
  })

  it('should find each managed cluster has default namespace', function() {
    clusterNamespace.validateClusterNamespace({"namespace": "default"}, "")
  })
  /*
  it('should find open-cluster-management-agent namespace exists', function() {
    clusterNamespace.validateClusterNamespace({"kind": "namespace","name" : "open-cluster-management-agent" }, "has_local-cluster")
  })

  it('should be able to save current search', function(){
    clusterNamespace.saveClusterNamespaceSearch({"namespace": "default" }, quaryDefaultNamespaceName, quaryDefaultNamespaceDesc)
    clusterNamespace.saveClusterNamespaceSearch({"kind": "namespace","name" : "open-cluster-management-agent" }, quaryOcmaNamespaceName, quaryOcmaNamespaceDesc)
  })

  it('should be able to find the saved search after logout and re-login', function(){
    cy.logout()
    cy.login()
    clusterNamespace.getSavedSearch(quaryDefaultNamespaceName)
    clusterNamespace.getSavedSearch(quaryOcmaNamespaceName)
  })
  */
})
