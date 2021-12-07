/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

exports.squad = 'observability-usa'
exports.tags = {
    env: ['@CANARY', '@ROSA'],
    modes: ['@BVT', '@SVT'],
    required: ['@REQUIRED'],
    component: ['@Obs'],
    status: ['@fresh-install', '@post-release', '@pre-upgrade', '@post-upgrade'],
    type: ['@e2e', '@sanity', '@smoke']
}
