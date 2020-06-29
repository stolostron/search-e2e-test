/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018, 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
/* Copyright (c) 2020 Red Hat, Inc.*/

module.exports = {
  enterTextInYamlEditor: (el, browser, yaml, time) => {
    el.click('.monaco-editor')
    const keystrokes = []
    if (process.platform == 'darwin') {
      keystrokes.push(browser.Keys.COMMAND)
    } else {
      keystrokes.push(browser.Keys.CONTROL)
    }
    keystrokes.push('a')
    keystrokes.push(browser.Keys.NULL)
    keystrokes.push(browser.Keys.BACK_SPACE)
    el.click('.monaco-editor')
    yaml.split(/\r?\n/).forEach(line => {
      const indentation = line.search(/\S|$/)
      line = line.replace('[TIME]', time)
      keystrokes.push(line)
      keystrokes.push(browser.Keys.RETURN)
      for (let i = 0; i < indentation / 2; i++ )
        keystrokes.push(browser.Keys.BACK_SPACE)
    })
    el.api.keys(keystrokes)
  }
}
