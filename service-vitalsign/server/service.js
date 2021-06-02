const express = require('express')
const bodyParser = require('body-parser')

const Images = require('./lib/VitalSign')

const service = express()
service.use(bodyParser.json()) // for json
// service.use(bodyParser.urlencoded({ extended: true })) // for form data

module.exports = (config) => {
  const log = config.log()
  const images = new Images(log)

  // Add a request logging middleware in development mode
  if (service.get('env') === 'development') {
    service.use((req, res, next) => {
      log.debug(`${req.method}: ${req.url}`)
      return next()
    })
  }


  service.get('/getAllVitalSignById/:id', (req, res, next) => {
    try {
      const { id } = req.params
      images.getPatienceAllVitalSigns(id).then( value => {
        if(value.status == undefined) next(value)
        return res.json({status: "success", data: value.data})
      })
    } catch(err) {
      return next(err)
    }
  })

  service.put('/setDataNumericsById/:id', (req, res, next) => {
    try {
      // body validater
      if(req.body.hr === undefined ||
        req.body.spo2 === undefined ||
        req.body.nibp === undefined ||
        req.body.time === undefined ||
        req.body.date === undefined)
        next(new Error('Some required field(s) in request body is missing.'))

      const { id } = req.params
      images.addVitalSignToPatience(id, req.body).then(status => {
        if(status != true) return next(status)
        return res.json({status: "success", data: req.body})
      })
    } catch(err) {
      return next(err)
    }
  })

  service.put('/setDataTwelveleadsById/:id', (req, res, next) => {
    try {
      // body validater
      if(req.body.twelveleads === undefined)
        next(new Error('Some required field(s) in request body is missing.'))

      const { id } = req.params
      images.addTwelveLeadsToPatience(id, req.body).then(status => {
        if(status != true) return next(status)
        return res.json({status: "success", data: req.body})
      })
    } catch(err) {
      return next(err)
    }
  })

  // eslint-disable-next-line no-unused-vars
  service.use((error, req, res, next) => {
    res.status(error.status || 500)
    // Log out the error to the console
    log.error(error)
    return res.json({
      error: {
        message: error.message,
      },
    })
  })
  return service
}
