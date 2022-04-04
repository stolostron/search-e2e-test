/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/**
 * Squad label displayed within the test metadata (Required by CICD).
 */
export const squad = 'observability-usa'

/**
 * Tags to determine the test environment.
 */
export const tags = {
  env: ['@CANARY', '@ROSA'],
  modes: ['@BVT', '@SVT'],
  required: ['@REQUIRED'],
}
