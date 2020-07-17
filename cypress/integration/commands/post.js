/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

const util = require('util')
const events = require('events')

function post () {}
util.inherits(post, events.EventEmitter)

post.prototype.command = function (url, body, auth, cb) {
  const self = this
  // const request = require('../../../../lib/server/request')

  const options = {
    url,
    method: 'POST',
    json: body
  }

  if (auth) {
    if (!options.headers) {
      options.headers = {}
    }
    options.headers.Authorization = auth
  }

  request(options, null, [200, 201, 204], (err, res) => {
    if (err)
      return cb(err, null)
    cb(err, res.statusCode)
    self.emit('complete')
  })
}

module.exports = post
