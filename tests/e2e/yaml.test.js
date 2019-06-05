/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

 const config = require('../../config')
module.exports = {
  '@disabled': false,
  before: function (browser) {
    const loginPage = browser.page.LoginPage()
    loginPage.navigate()
    loginPage.authenticate()

    const url = `${browser.launch_url}${config.get('contextPath')}/details/local-cluster/api/v1/namespaces/kube-system/configmaps/my-test-config`
    yamlPage = browser.page.YamlPage()
    yamlPage.navigate(url)
    
  },

  'Yaml: Edit page': (browser) => {
    yamlPage.verifyEditBtnTxt(browser, 'EditEdit')
    yamlPage.edit()
    yamlPage.enterTextInYamlEditor(browser, '  key4: config4')
    yamlPage.edit()
    yamlPage.verifyEditBtnTxt(browser,'Save')
    yamlPage.save()
  },
  after: function (browser, done) {
    setTimeout(() => {
      browser.end()
      done()
    })
  }
}