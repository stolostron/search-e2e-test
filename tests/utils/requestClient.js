/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

const axios = require('axios');
const qs = require('querystring');
const config = require('../../config');

module.exports = {
  getAccessToken() {
   return axios.post(
      `https://${config.get('CLUSTER_IP')}:${config.get('CLUSTER_PORT')}/idprovider/v1/auth/identitytoken`,
      qs.stringify({
        grant_type: 'password',
        scope: 'openid',
        username: config.get('CLUSTER_ADMIN_USR'),
        password: config.get('CLUSTER_ADMIN_PWD'),
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .catch((err) => console.log(err))
      .then((res) => res.data.access_token);
  },

  getKubeToken(accessToken) {
    return axios.post(
      `https://${config.get('CLUSTER_IP')}:${config.get('CLUSTER_PORT')}/idprovider/v1/auth/exchangetoken`,
      qs.stringify({
        access_token: accessToken,
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
    .catch((err) => console.log(err))
    .then((res) => res.data.id_token);
  },

  request(path, method, jsonBody, accessToken) {
    return axios({
      url: `https://${config.get('CLUSTER_IP')}:${config.get('CLUSTER_PORT')}${path}`,
      method,
      data: jsonBody,
      headers: {
        Authorization: `bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })
    .catch((err) => console.log(err))
    .then(res => res.data);
  },

  kubeRequest(path, method, jsonBody, kubeToken) {
    return axios({
      url: `https://${config.get('CLUSTER_IP')}:6443${path}`,
      method,
      data: jsonBody,
      headers: {
        Authorization: `bearer ${kubeToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })
    .catch((err) => err)
    .then(res => res.data);
  }
}