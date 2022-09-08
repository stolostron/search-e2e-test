/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

export const SEARCH_API_V1 = process.env.SEARCH_API_V1 || false
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
