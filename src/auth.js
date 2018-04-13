'use strict'

require('dotenv').config()
const jwt = require('jsonwebtoken')
const AWS = require('aws-sdk')
const signingSecret = process.env.SIGNING_SECRET || ''

let secret = null
class Authentication {
  syncSecret() {
    if (signingSecret) {
      secret = signingSecret
    } else {
      AWS.config.update({ region: 'us-west-2' })
      var ssm = new AWS.SSM()
      var params = {
        Names: ['data-platform-pod0-dev.centrify.io.jwt-secret-signing'],
        WithDecryption: true,
      }
      ssm.getParameters(params, function(err, data) {
        if (err) {
          console.log(err, err.stack)
        } else {
          secret = data['Parameters'][0]['Value']
          console.log('secret key:', secret)
        }
      })
    }
  }

  authToken(token, res) {
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' })
    jwt.verify(token, secret, function(err, verifiedJwt) {
      if (err) {
        console.log(err)
        return res.status(401).send({ auth: false, message: 'Failed to authenticate token.' })
      } else {
        console.log(verifiedJwt)
      }
    })
  }
}

module.exports = Authentication
