/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018, 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
/* Copyright (c) 2020 Red Hat, Inc. */

const del = require('del')
const BASE_DIR = `${__dirname}/../..`
const reportFolder = `${BASE_DIR}/test-output/e2e`
const time = new Date().getTime()
const { createCoverageReporter } = require('nightwatch-coverage')

const coverageReporter = createCoverageReporter({
  coverageDirectory: `${reportFolder}/coverage`,
  coverageReporters: ['html', 'json', 'lcov'],
})

module.exports = {

  coverageReporter: coverageReporter,

  // External before hook is ran at the beginning of the tests run, before creating the Selenium session
  before: function(done) {
    del([reportFolder, `${BASE_DIR}/selenium-debug.log`]).then(() => {
      // eslint-disable-next-line no-console
      console.log('Deleted test reports and logs.')
      done()
    })
  },

  time: time,

  // External after hook is ran at the very end of the tests run, after closing the Selenium session
  after: function(done) {
    coverageReporter.save() // call this function in your global after hook
    done()
  },

  // This will be run before each test suite is started
  beforeEach: function(browser, done) {
    done()
  },

  // This will be run after each test suite is finished
  afterEach: function(browser, done) {
    browser.collectCoverage(() => {
      browser.end(done)
    })
  }
}
