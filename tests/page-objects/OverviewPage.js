/*******************************************************************************
* Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
/* Copyright (c) 2020 Red Hat, Inc.
*/

//import verifyTable from '../page-objects/AllPolicyPage'

module.exports = {
  elements: {
    //basic page elements
    headerTitle: '.bx--detail-page-header-title',
    spinner: '.content-spinner',
    overviewContainer: '.overview-view',
    //recent activity
    recentActivityContainer: '.module-recent-activity',
    recentPolicyViolations: '.module-recent-activity > div > div:nth-child(2) > div > div > div:nth-child(1)',
    recentClusterViolations: '.module-recent-activity > div > div:nth-child(2) > div > div > div:nth-child(2)',
    highSeverityFindings: '.module-recent-activity > div > div:nth-child(2) > div > div > div:nth-child(3)',
    mediumSeverityFindings: '.module-recent-activity > div > div:nth-child(2) > div > div > div:nth-child(4)',
    lowSeverityFindings: '.module-recent-activity > div > div:nth-child(2) > div > div > div:nth-child(5)',
    //violation containers
    violationContainer: '.violation-container',
    topViolations: '.module-top-violations:nth-of-type(1)',
    topSecurityFindings: '.module-top-violations:nth-of-type(2)',
    violationsUnclickedTab: '.bx--tabs__nav-item',
    //most impacted controls
    moduleImpactedControls: '.module-impacted-controls',
    impactedControlsKey: '.card-legend',
    impactedControlsGraph: '.card-radar',
    impactedControlsSelector: '.bx--tabs-trigger',
    impactedControlsSlider: '.card-slider',
    //policy summary
    modulePolicySummary: '.module-policy-summary',
    policySummaryCardCluster: '.card-container'
  },
  commands: [{
    verifyPageLoaded,
    verifyRecentActivity,
    verifyViolationTable,
    verifyMostImpactedControls,
    verifyPolicySummary
  }]
}

/**
 * Verifications
 */

function verifyPageLoaded() {
  this.expect.element('@headerTitle').to.be.present
  this.expect.element('@spinner').to.be.present
  this.waitForElementNotPresent('@spinner')
  this.expect.element('@overviewContainer').to.be.present
}

function verifyRecentActivity(browser) {
  this.expect.element('@recentActivityContainer').to.be.present
  this.expect.element('@recentPolicyViolations').to.be.present
  this.click('@recentPolicyViolations')
  followRecentActivityButton(browser, false)
  this.click('li#policy-overview.bx--tabs__nav-item')
  this.click('@recentClusterViolations')
  followRecentActivityButton(browser, true)
  this.click('li#policy-overview.bx--tabs__nav-item')
  this.click('@highSeverityFindings')
  followRecentActivityButton(browser, false)
  this.click('li#policy-overview.bx--tabs__nav-item')
  this.click('@mediumSeverityFindings')
  followRecentActivityButton(browser, false)
  this.click('li#policy-overview.bx--tabs__nav-item')
  this.click('@lowSeverityFindings')
  followRecentActivityButton(browser, false)
  this.click('li#policy-overview.bx--tabs__nav-item')
}

function verifyViolationTable() {
  this.expect.element('@violationContainer').to.be.present
  this.expect.element('@topViolations').to.be.present
  this.click('@violationsUnclickedTab')
  //this.expect.element('@topViolationsCardCluster').to.be.present
  this.expect.element('@topSecurityFindings').to.be.present
  //this.expect.element('@topSecurityFindingsCardCluster').to.be.present
}

function verifyMostImpactedControls() {
  this.expect.element('@moduleImpactedControls').to.be.present
  this.expect.element('@impactedControlsKey').to.be.present
  this.expect.element('@impactedControlsGraph').to.be.present
  this.expect.element('@impactedControlsSelector').to.be.present
  this.expect.element('@impactedControlsSlider').to.be.present
}

function verifyPolicySummary() {
  this.expect.element('@modulePolicySummary').to.be.present
  this.expect.element('@policySummaryCardCluster').to.be.present
}

function followRecentActivityButton(browser, cluster) {
  browser.pause(3000)
  browser.element('css selector', 'div.no-resource', function(result){
    if(result.value !== false){
      this.expect.element('div.no-resource').to.be.present
    }
    else{
      this.expect.element('table.bx--data-table-v2.resource-table.bx--data-table-v2--zebra').to.be.present
      if (!cluster) {
        this.click('button.bx--table-expand-v2__button:nth-of-type(1)')
        this.expect.element('tr.bx--expandable-row-v2:nth-of-type(2)').to.be.present
        this.click('button.bx--table-expand-v2__button:nth-of-type(1)')
        this.expect.element('tr.bx--expandable-row-v2:nth-of-type(2)').to.be.not.present
      }
    }
  })
}
