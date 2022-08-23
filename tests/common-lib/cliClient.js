// Copyright Contributors to the Open Cluster Management project

const { execSync } = require('child_process')

const execCliCmdString = async (commands) => {
  const cmds = commands.split('\n')
  cmds.forEach((cmd) => {
    // Ignore empty lines and comments.
    if (cmd.trim() && cmd.trim().charAt(0) !== '#') {
      execSync(cmd.trim())
    }
  })
}

exports.execCliCmdString = execCliCmdString
