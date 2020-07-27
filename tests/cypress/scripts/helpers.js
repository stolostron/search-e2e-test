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
  const xmlReportsPath = path.join(__dirname, '..', '..', 'test-output', 'cypress', 'xml')
  const reports = fs.readdirSync(xmlReportsPath).map(report => path.join(xmlReportsPath, report))
  junitMerger.mergeFiles(reports)
}
