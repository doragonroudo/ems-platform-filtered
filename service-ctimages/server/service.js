require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer');
const mime = require('mime');
const fsExtra = require('fs-extra')

const Images = require('./lib/Images')
var cors = require('cors')
const service = express()

var corsOptions = {
  origin: 'http://127.0.0.1:3001',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

service.use(cors(corsOptions))
service.use(bodyParser.json()) // for json
service.use(bodyParser.urlencoded({ extended: false })) // for form data
/*
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads')
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
*/

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limiting files size to 5 MB
  },
});

const admin = require('firebase-admin');

const serviceAccount = require("./lib/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.GCLOUD_BUCKET_NAME
});

var bucket = admin.storage().bucket();
const db = admin.firestore()

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

  service.put('/addCTVideoToPatientById/:id', (req, res, next) => {
    try {
      // body validater
      if(req.body.video_url === undefined)
        next(new Error('<video_url> in request body is missing.'))

      const { id } = req.params
      images.setVideoUrlInDatabase(db, id, req.body.video_url).then( vid_status => {
        if (vid_status == "fail") next(new Error('Error updating video url'))
        res.json({status: "success", data: req.body})
      })
    } catch(err) {
      return next(err)
    }
  })

  service.put('/addCTImagesToPatientById/:id', cors(corsOptions), uploader.array('images'), (req, res, next) => {
    try {
      const { id } = req.params

      console.log(id)
      console.log(req.body);
      console.log(req.files);
      // res.end("File is uploaded");
      /*
      if(req.body.video_url === undefined)
        next(new Error('<video_url> parameter in request body is missing.'))
      */

      if(req.files === undefined)
        next(new Error('<images> file(s) parameter in request body is missing.'))
      
      if(req.files.length == 0)
        next(new Error('<images> file(s) in request body is missing.'))

      const promises = req.files.map((file, index) => {

        return new Promise((resolve, reject) => {
          
          const newFileName = id + '-ctimage-' + Date.now() + '.' + mime.getExtension(file.mimetype)
          // Create new blob in the bucket referencing the file
          const blob = bucket.file(newFileName);

          // Create writable stream and specifying file mimetype
          const blobWriter = blob.createWriteStream({
            metadata: {
              contentType: file.mimetype,
            },
          });

          blobWriter.on('error', (err) => {
            console.log(err);
            reject
          });

          blobWriter.on('finish', () => {
            // Assembling public URL for accessing the file via HTTP
            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${
              bucket.name
            }/o/${encodeURI(blob.name)}?alt=media`;

            // Return the file name and its public URL
            // console.log(file.originalname, publicUrl)
            images.addOne(db, id, {originalFileName: file.originalname, filename: newFileName, url: publicUrl}).then( status => {
              resolve({filename: newFileName, url: publicUrl, images_saving_status: status})
            })
          });

          // When there is no more data to be consumed from the stream
          blobWriter.end(file.buffer);
        }).catch(err => {
          console.log(err);
          next(err)
        })
        
      })

      Promise.all(promises).then(function(results) {
        console.log('upload done');
        console.log(results)
        res.json({status: "success", data: results})
      })
    } catch(err) {
      console.log(err);
      return res.end("Error uploading file.");
    }
    
  });

  service.get('/getCTImagesOfPatientById/:id', (req, res, next) => {
    try {
      const { id } = req.params
      images.getAllImages(db, id).then(value => {
        log.debug('dataList', value.dataList);
        if(value.status == undefined) return next(value) 
        if(Object.keys(value.dataList).length === 0) return next(new Error('List is empty or there is a problem fetching list.'))
        return res.json({status: "success", data: value.dataList})
      })
    } catch(err) {
      return next(err)
    }
  })

  service.get('/getCTVideosOfPatientById/:id', (req, res, next) => {
    try {
      const { id } = req.params
      images.getAllVideos(db, id).then(value => {
        log.debug('dataList', value.dataList);
        if(value.status == undefined) return next(value) 
        if(Object.keys(value.dataList).length === 0) return next(new Error('List is empty or there is a problem fetching list.'))
        return res.json({status: "success", data: value.dataList})
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
