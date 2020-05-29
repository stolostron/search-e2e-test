/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 * Copyright (c) 2020 Red Hat, Inc.
 *******************************************************************************/

const axios = require('axios');
const qs = require('querystring');
const config = require('../../config');

module.exports = {
  kubeRequest(path, method, jsonBody, kubeToken) {
    return axios({
      url: `https://api.${config.get('options:hub:baseDomain')}:6443${path}`,
      method,
      data: jsonBody,
      headers: {
        Authorization: `bearer ${kubeToken}`,
        'Content-Type': method !== 'patch' ? 'application/json' : 'application/json-patch+json',
        'Accept': 'application/json',
      }
    })
    .catch((err) => {
      console.log('Error at kubeRequest(): ', err.message);
      throw(err)
    })
    .then(res => res.data);
  }
}