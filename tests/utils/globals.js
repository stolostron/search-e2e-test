/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

// const del = require('del')
// const fs = require('fs')
// const path = require('path')
// const jsonfile = require('jsonfile')
// const parser = require('xml2json')
// const BASE_DIR = `${__dirname}/../..`
// const reportFolder = `${BASE_DIR}/test-output/e2e`

/* eslint-disable no-console*/
module.exports = {

  // External before hook is ran at the beginning of the tests run, before creating the Selenium session
  before: function(done) {
  //   del([reportFolder, `${BASE_DIR}/selenium-debug.log`]).then(() => {
  //     console.log('Deleted test reports and logs.')
      done()
  //   })
  },

  // External after hook is ran at the very end of the tests run, after closing the Selenium session
  after: function(done) {
    // fs.readdirSync(reportFolder).forEach(file => {
    //   if (file.endsWith('.xml')) {
    //     const xml = fs.readFileSync(path.join(reportFolder, file))
    //     const parsedDoc = parser.toJson(xml, {object: true, alternateTextNode: true, trim: true})
    //     jsonfile.writeFileSync(path.join(reportFolder, file.replace('.xml', '.json')), parsedDoc/*, {spaces: 2, EOL: '\r\n'}*/)
    //   }
    // })
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
