const express = require('express')
const bodyParser = require('body-parser')

const Database = require('./lib/Database')

const service = express()
service.use(bodyParser.json())

module.exports = (config) => {
  const log = config.log()
  const database = new Database(log)

  // Add a request logging middleware in development mode
  if (service.get('env') === 'development') {
    service.use((req, res, next) => {
      log.debug(`${req.method}: ${req.url}`)
      return next()
    })
  }

  service.get('/getAllPatientsInfo', (req, res, next) => {
    try {
      database.getAllPatiences().then(value => {
        log.debug('dataList', value.dataList);
        if(value.status == undefined) return next(value) 
        if(Object.keys(value.dataList).length === 0) return next(new Error('List is empty or there is a problem fetching list.'))
        return res.json({status: "success", data: value.dataList})
      })
    } catch(err) {
      return next(err)
    }
  })

  service.get('/getPatientInfoById/:id', (req, res, next) => {
    try {
      const { id } = req.params
      database.databaseFindByKey(id).then(value => {
        if(value.status == undefined) return next(value)
        if(value.data === undefined) return next(new Error('Patient exists but their data is empty.'))
        return res.json({status: "success", data: value.data})
      }).catch(err => {
        return err
      })
    } catch(err) {
      return next(err)
    }
  })

  service.put('/addNewPatient', (req, res, next) => {
    try {
      // body validater
      if(req.body.id === undefined ||
        req.body.name === undefined ||
        req.body.age === undefined ||
        req.body.medical_treatment_right === undefined ||
        req.body.diagnosis === undefined ||
        req.body.congenital_disease === undefined ||
        req.body.sympthom_description === undefined ||
        req.body.last_seen_normal === undefined ||
        req.body.onset === undefined)
        next(new Error('Some required field(s) in request body is missing.'))

      console.log(req.body);
      database.addPatience(req.body).then(status => {
        if(status != true) return next(err)
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
      status: "fail",
      error: {
        message: error.message
      }
    })
  })
  return service
}
