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
  elements: {
    yamlDisplay: "div.resource-details-page",
    edit: 'button[class="bx--btn bx--btn--primary"]',
    yamlContainer: "div.page-content-container",
    textArea: "textarea.ace_text-input" ,
    save: 'button[class="bx--btn bx--btn--danger--primary"]',
    dialog: "div.bx--modal-container",
    aceEditorTextInput: '#brace-editor',
    registerAppModal: '.bx--modal'
    },

  commands: [{
    verifyPageContent,
    edit,
    enterTextInYamlEditor,
    save
  }]
}
/**
 * Verifications
 */
function verifyPageContent() {
    this.waitForElementPresent('@yamlDisplay')
    this.expect.element('@yamlContainer').to.be.present
  }

  function edit() {
    this.waitForElementVisible('@edit')
      .click('@edit')
  }

  function save() {
    this.waitForElementVisible('@save')
      .click('@save')
  }

  function enterTextInYamlEditor(browser, yaml){
    this.waitForElementPresent('@registerAppModal')
    this.click('@aceEditorTextInput')
  
    const keystrokes = []
    yaml.split(/\r?\n/).forEach(line => {
      const indentation = line.search(/\S|$/)
      keystrokes.push(line)
      keystrokes.push(browser.Keys.RETURN)
      for (let i = 0; i < indentation / 2; i++ )
        keystrokes.push(browser.Keys.BACK_SPACE)
    })
    this.api.keys(keystrokes)
  }