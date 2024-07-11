/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

const path = require('path')
const del = require('del')

exports.cleanReports = () => {
  const reportPath = path.join(__dirname, '..', '..', 'results')
  del.sync([reportPath])
}
