const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer');
const mime = require('mime');
const fsExtra = require('fs-extra')

const Gateway = require('./lib/Gateway')

const service = express()

service.use(bodyParser.json())
service.use(bodyParser.urlencoded({ extended: false })) // for form data

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + "." + mime.getExtension(file.mimetype))
  }
})

const uploader = multer({
  storage: storage,
  limits: {
      fileSize: 5 * 1024 * 1024, // keep images size < 5 MB
  },
})

module.exports = (config) => {
  const log = config.log()
  const gateway = new Gateway(log)

  // Add a request logging middleware in development mode
  if (service.get('env') === 'development') {
    service.use((req, res, next) => {
      log.debug(`${req.method}: ${req.url}`)
      return next()
    })
  }

  service.get('/:service/:endpoint/:argument?', async (req, res, next) => {
    try {
      const { service, endpoint, argument } = req.params
      console.log('paraMs', req.params);
      const value = await gateway.forwardGetToService(service, endpoint, argument)
      return res.json(value)
    } catch(err) {
      return next(err)
    }
  })

  service.post('/:service/:endpoint/:argument?', uploader.array('images'), async (req, res, next) => {
    try {
      const { service, endpoint, argument } = req.params
      console.log(req.body);
      console.log(req.files);
      
      if(req.files) {
        console.log('There is a file')
        const value = await gateway.forwardPostToServiceMultipartForm(service, endpoint, argument, req.body, req.files)
        fsExtra.emptyDirSync('uploads')
        return res.json(value)
      } else {
        console.log('There is NO file')
        const value = await gateway.forwardPostToService(service, endpoint, argument, req.body)
        return res.json(value)
      }
    } catch (err) {
      console.log("Error uploading file.");
      return next(err)
    }
  })

  service.put('/:service/:endpoint/:argument?', uploader.array('images'), async (req, res, next) => {
    try {
      const { service, endpoint, argument } = req.params
      log.debug('Request Body:', req.body);
      log.debug('Request File:', req.files);
      
      if(req.files) {
        log.debug('There is a file in the request, forward with type multipart/form-data')
        const value = await gateway.forwardPutToServiceMultipartForm(service, endpoint, argument, req.body, req.files)
        fsExtra.emptyDirSync('uploads')
        return res.json(value)
      } else {
        log.debug('There is NO file in the request, forward with type application/json')
        const value = await gateway.forwardPutToService(service, endpoint, argument, req.body)
        return res.json(value)
      }
    } catch (err) {
      log.debug("Error uploading file.");
      return next(err)
    }
  })

  // eslint-disable-next-line no-unused-vars
  service.use((error, req, res, next) => {
    res.status(error.status || 500)
    // Log out the error to the console
    log.error(error)
    if(error.constructor.name == "TypeError")
      return res.json({
        error: {
          message: "Service did not response (TypeError)",
        },
      })
    return res.json({
      error: {
        message: error.message,
      },
    })
  })
  return service
}