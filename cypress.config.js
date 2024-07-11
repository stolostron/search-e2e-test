const { defineConfig } = require('cypress')

module.exports = defineConfig({
  chromeWebSecurity: false,
  defaultCommandTimeout: 20000,
  fixturesFolder: 'tests/cypress/fixtures',
  pageLoadTimeout: 60000,
  numTestsKeptInMemory: 10,
  screenshotsFolder: 'results/screenshots',
  videosFolder: 'results/videos',
  watchForFileChanges: true,
  env: {
    OPTIONS_HUB_OC_IDP: 'kube:admin',
    OPTIONS_HUB_USER: 'kubeadmin',
    OPTIONS_MANAGED_USER: 'kubeadmin',
  },
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    reporterEnabled: 'mochawesome, mocha-junit-reporter',
    mochawesomeReporterOptions: {
      reportDir: 'results/json',
      reportFilename: 'mochawesome-report.json',
      overwrite: false,
      html: false,
      json: true,
    },
    mochaJunitReporterReporterOptions: {
      mochaFile: 'results/cypress-[hash].xml',
    },
  },
  retries: 2,
  viewportHeight: 1050,
  viewportWidth: 1680,
  projectId: '',
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      require('@cypress/grep/src/plugin')(config)
      return require('./tests/cypress/plugins/index.js')(on, config)
    },
    specPattern: 'tests/cypress/tests/**/*.spec.js',
    excludeSpecPattern: [],
    supportFile: 'tests/cypress/support/index.js',
  },
})
