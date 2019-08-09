const express = require('express');
const router = express.Router();
const multer = require('multer');
require('events').EventEmitter.defaultMaxListeners = Infinity;
/**
 * NPM Module dependencies for streaming audio.
 */
const mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

/**
 * NodeJS Module dependencies for streaming audio.
 */
const { Readable } = require('stream');

//add http://localhost:3000 when testing locally
const whitelist = ['https://pop-server.hopto.org', 'https://proof-of-plays.com',
  'https://proofofplays.hopto.org', 'http://proofofplays.hopto.org', 'http://proof-of-plays.com', 'http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

/**
 * Connect Mongo Driver to MongoDB for audio database.
 */
let db;
MongoClient.connect('mongodb://localhost/trackDB-dev',
  { useNewUrlParser: true }, (err, client) => {
    if (err) {
      console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
      process.exit(1);
    }
    db = client.db('trackDB-dev');
  });

/**
 * GET /audio/:trackID
 */
router.get('/:trackID', (req, res) => {
  try {
    var trackID = new ObjectID(req.params.trackID);
  } catch(err) {
    return res.status(400).json({ message: 'Invalid trackID in URL parameter. Must be a single String of 12 bytes or a string of 24 hex characters' });
  }
  res.set('content-type', 'audio/mp3');
  res.set('accept-ranges', 'bytes');

  let bucket = new mongodb.GridFSBucket(db, {
    bucketName: 'tracks'
  });

  let downloadStream = bucket.openDownloadStream(trackID);

  downloadStream.on('data', (chunk) => {
    res.write(chunk);
  });

  downloadStream.on('error', () => {
    res.sendStatus(404);
  });

  downloadStream.on('end', () => {
    res.end();
  });
});

/**
 * POST /audio
 * max size of 10MB
 */
router.post('/', (req, res) => {
  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage, limits: { fields: 1, fileSize: 10000000, files: 1, parts: 2 }});
  upload.single('track')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: 'Upload Request Validation Failed' });
    } else if(!req.body.name) {
      return res.status(400).json({ message: 'No track name in request body' });
    }

    let trackName = req.body.name;
    // Covert buffer to Readable Stream
    const readableTrackStream = new Readable();
    readableTrackStream.push(req.file.buffer);
    readableTrackStream.push(null);

    let bucket = new mongodb.GridFSBucket(db, {
      bucketName: 'tracks'
    });

    let uploadStream = bucket.openUploadStream(trackName);
    let id = uploadStream.id;
    readableTrackStream.pipe(uploadStream);

    uploadStream.on('error', () => {
      return res.status(500).json({ message: 'Error uploading file' });
    });

    uploadStream.on('finish', () => {
      return res.status(201).json({
        message: 'Success!',
        id });
    });
  });
});

module.exports = router;
