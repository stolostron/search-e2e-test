/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

const fs = require('fs')
const path = require('path')
const del = require('del')
const junitMerger = require('junit-report-merger')

exports.cleanReports = () => {
  const reportPath = path.join(__dirname, '..', '..', 'test-output', 'cypress')
  del.sync([reportPath])
}

exports.mergeXmlReports = () => {
  const { TEST_GROUP } = process.env
  const fileName = `console-ui${TEST_GROUP ? `-${TEST_GROUP}` : ''}.xml`
  const mergedReportPath = path.join(__dirname, '..', '..', 'test-output', fileName)
  const xmlReportsPath = path.join(__dirname, '..', '..', 'test-output', 'cypress', 'xml')
  const reports = fs.readdirSync(xmlReportsPath).map(report => path.join(xmlReportsPath, report))
  junitMerger.mergeFiles(mergedReportPath, reports)
}

exports.getKubeToken = () => {
  let kubeToken = ''
  try {
    cy.exec(`oc login -u ${Cypress.env('user')} -p ${Cypress.env('password')} --server=https://api.${Cypress.env('baseDomain')}:6443 --insecure-skip-tls-verify=true`)
     .then(() => {
       cy.exec('oc whoami -t').then((res) => {
        process.env.SERVICEACCT_TOKEN = res.stdout
        kubeToken = res.stdout
        console.log('kubeToken', kubeToken)
        return kubeToken
      })
     })
  } catch (e){
    console.error('Error getting kube token. ', e);
    return kubeToken
  }
}
