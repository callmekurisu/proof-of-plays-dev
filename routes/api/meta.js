const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const mongoose = require('mongoose');
const admin = require('../../config/keys');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
// Use LND API for sending payment
const grpc = require('grpc');
const fs = require('fs');
require('events').EventEmitter.defaultMaxListeners = Infinity;
// Due to updated ECDSA generated tls.cert we need to let gprc know that
// we need to use that cipher suite otherwise there will be a handhsake
// error when we communicate with the lnd rpc server.
process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA';
// SSL error hack
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
//  Lnd cert is at ~/.lnd/tls.cert on Linux and
//  ~/Library/Application Support/Lnd/tls.cert on Mac
const tlsPath = path.join(__dirname, '..', '..', 'config', 'tls.cert');
const macaroonPath = path.join(__dirname, '..', '..', 'config', 'admin.macaroon');
const lndCert = fs.readFileSync(tlsPath);
const sslCreds = grpc.credentials.createSsl(lndCert);
const macaroonCreds = grpc.credentials.createFromMetadataGenerator(function (args, callback) {
  const macaroon = fs.readFileSync(macaroonPath).toString('hex');
  const metadata = new grpc.Metadata();
  metadata.add('macaroon', macaroon);
  callback(null, metadata);
});
//credentials for lightning network node
const creds = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
const credentials = grpc.credentials.createSsl(lndCert);
const lnrpcDescriptor = grpc.load('rpc.proto');
const lnrpc = lnrpcDescriptor.lnrpc;
const lightning = new lnrpc.Lightning('localhost:10009', creds);
// End LND API config

require('events').EventEmitter.defaultMaxListeners = Infinity;
//add http://localhost:3000 when testing locally
const whitelist = [
  'https://pop-server.hopto.org',
  'https://proof-of-plays.com',
  'https://proofofplays.hopto.org',
  'http://proofofplays.hopto.org',
  'http://proof-of-plays.com',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

// Song model
const Song = require('../../models/Song');

// @route   GET api/meta/test
// @desc    Tests songs route
// @access  Public
// @status  Working
router.get('/test', (req, res) => res.json({ msg: 'Meta API works' }));

// @route   GET api/meta
// @desc    Get metadata for all songs
// @access  Public
// @status  Working
router.get('/', cors(corsOptions), (req, res) => {
  // Modify response with projections
  Song.find(
    {},
    {
      title: 1,
      balance: 1,
      artist: 1,
      plays: 1,
      explicit: 1,
      balance: 1,
      audio: 1
    }
  )
    .sort({ date: -1 })
    .then(songs => res.status(200).json(songs))
    .catch(err => res.status(404).json({ songnotfound: 'No songs found' }));
});

// @route   GET api/meta/:id
// @desc    Get metadata for song by id
// @access  Public
// @status  Working
router.get('/:id', cors(corsOptions), (req, res) => {
  Song.findById(req.params.id)
    .then(song => res.json(song))
    .catch(err =>
      res.status(404).json({ songnotfound: 'No song found with that ID' })
    );
});

// @route   POST api/meta
// @desc    Create song metadata
// @access  Public
// @status  Working
router.post('/', cors(corsOptions), (req, res) => {
  const newSong = new Song({
    title: req.body.title,
    artist: req.body.artist,
    passcode: req.body.passcode,
    pubkey: req.body.pubkey,
    explicit: req.body.explicit,
    audio: req.body.audio,
    autopay: req.body.autopay,
    macaroon: req.body.macaroon
  });
  // Hash passcode. For uploader to access payouts.
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newSong.passcode, salt, (err, hash) => {
      if (err) {
        throw err;
      }
      newSong.passcode = hash;
      newSong
        .save()
        .then(song =>
          // remove passcode before sending response
          res.status(200).json({ message: 'success' })
        )
        .catch(() => res.status(400).json({ error: 'Couldn\'t save new song' }));
    });
  });
});
// @route   GET api/meta/home/popular
// @desc    Get metadata for song with most plays
// @access  Public
// @status  Working
router.get('/home/popular', cors(corsOptions), (req, res) => {
  // Modify response with projections
  Song.find(
    {},
    {
      title: 1,
      balance: 1,
      artist: 1,
      plays: 1,
      explicit: 1,
      balance: 1,
      audio: 1
    }
  )
    .sort({ plays: -1 })
    .limit(3)
    .then(songs => res.status(200).json(songs))
    .catch(err => res.status(404).json({ songnotfound: 'No songs found' }));
});

// @route   GET api/meta/home/rando
// @desc    Pull random song from db every 15 minutes
// @access  Public
// @status  Working
router.get('/home/rando', cors(corsOptions), (req, res) => {
  Song.find(
    {},
    {
      title: 1,
      balance: 1,
      artist: 1,
      plays: 1,
      explicit: 1,
      balance: 1,
      audio: 1
    }
  )
    .aggregate([{ $sample: { size: 1 } }])
    .then(songs => res.status(200).json(songs))
    .catch(err => res.status(404).json({ songnotfound: 'No songs found' }));
});

// @route   DELETE api/meta/:id/:adminKey
// @desc    Delete metadata for one song
// @access  Admin
router.delete('/:id/:adminKey', cors(corsOptions), (req, res) => {
  Song.findById(req.params.id)
    .then(song => {
      // Check for admin
      if (req.params.adminKey !== admin.superSecret) {
        return res.status(401).json({ notauthorized: 'User not authorized' });
      }

      // Delete
      song.remove().then(() => res.json({ success: true }));
    })
    .catch(err =>
      res.status(404).json({
        songnotfound: 'No song found'
      })
    );
});

// @route   POST api/songs/comment/:id
// @desc    Add comment to song
// @access  Public
// @status  In progress
router.post('/comment/:id', cors(corsOptions), (req, res) => {
  Song.findById(req.params.id)
    .then(song => {
      const newComment = {
        text: req.body.text
      };

      // Add to comments array
      song.comments.unshift(newComment);

      // Save
      song.save().then(post => res.json(post));
    })
    .catch(err => res.status(404).json({ pollnotfound: 'No post found' }));
});

// @route   POST /archive/increase/:id
// @desc    Modify song payout balance for historical tracks
// @access  Admin
// @status  Working
router.post('/archive/increase/:id', cors(corsOptions), (req, res) => {
  Song.findById(req.params.id)
    .then(song => {
      // Increase balance by amount of invoice
      song.balance = parseInt(song.balance) + 100;
      song.save();
      const data = {
        memo: 'Proof of Plays Autopayment',
        value: 100
      };
      const headers = {
        'Content-Type': 'application/json',
        'Grpc-Macaroon-metadata': `${song.macaroon}`
      };
      // Get autopay data if possible
      axios.post(`${song.autopay}`, data, {headers: headers})
        .then(res2 => {
          const payReq = res2.data.payment_request;
          // Attempt autopay with data from user's server
          // Make a request to payment server
          const decodePayReq = {
            pay_req: payReq
          };
          const paymentRequest = {
            payment_request: payReq
          };
          lightning.decodePayReq(decodePayReq, function (err, response) {
            const amt = parseInt(response.num_satoshis);
            amt > song.balance
              ? // Not enough loot
              res.status(404).json({ error: 'Insufficient funds' })
              : setTimeout(() => {
                lightning.sendPaymentSync(paymentRequest, function (err, payRes) {
                  // Check for routing errors
                  console.log(payRes);
                  if (amt === 0 || amt === null || amt === undefined) {
                    // Handle zero amount invoices
                    res.status(400).json({ error: 'Zero amount invoice not accepted' });
                  } else if (err) {
                    res.status(400).json({ error: `${err}` });
                  } else if (payRes.payment_error === 'payment is in transition') {
                    // Decrease balance by amount of invoice
                    song.balance = song.balance - amt;
                    song.save();
                    res.status(200).json({ error: `${payRes.payment_error}` });
                  } else if (payRes.payment_error !== 'payment is in transition' &&
                             payRes.payment_error != '') {
                    // Just send the error back
                    res.status(400).json({ error: `${payRes.payment_error}` });
                  } else {
                    // Decrease balance by amount of invoice
                    song.balance = song.balance - amt;
                    song.save();
                    // Send payment info with new balance
                    res.status(200).json({
                      success: payRes,
                      balance: song.balance
                    });
                  }
                });
              }, 1000);
          });
        }).catch(err => {
          res.status(400).json({ error: 'Autopay failed' });
        });
    });
});

// @route   POST /archive/increase/:id
// @desc    Modify song payout balance for historical tracks
// @access  Admin
// @status  Working
router.post('/popular/increase/:id', cors(corsOptions), (req, res) => {
  Song.findById(req.params.id)
    .then(song => {
      // Increase balance by amount of invoice
      song.balance = parseInt(song.balance) + 1000;
      song.save();
      const data = {
        memo: 'Proof of Plays Autopayment',
        value: 1000
      };
      const headers = {
        'Content-Type': 'application/json',
        'Grpc-Macaroon-metadata': `${song.macaroon}`
      };
      // Get autopay data if possible
      axios.post(`${song.autopay}`, data, {headers: headers})
        .then(res2 => {
          const payReq = res2.data.payment_request;
          // Attempt autopay with data from user's server

          // Make a request to LND API
          const decodePayReq = {
            pay_req: payReq
          };
          const paymentRequest = {
            payment_request: payReq
          };
          lightning.decodePayReq(decodePayReq, function (err, response) {
            const amt = parseInt(response.num_satoshis);
            amt > song.balance
              ? // Not enough loot
              res.status(404).json({ error: 'Insufficient funds' })
              : setTimeout(() => {
                lightning.sendPaymentSync(paymentRequest, function (err, payRes) {
                  // Check for routing errors
                  console.log(payRes);
                  if (amt === 0 || amt === null || amt === undefined) {
                    // Handle zero amount invoices
                    res.status(400).json({ error: 'Zero amount invoice not accepted' });
                  } else if (err) {
                    res.status(400).json({ error: `${err}` });
                  } else if (payRes.payment_error === 'payment is in transition') {
                    // Decrease balance by amount of invoice
                    song.balance = song.balance - amt;
                    song.save();
                    res.status(200).json({ error: `${payRes.payment_error}` });
                  } else if (payRes.payment_error !== 'payment is in transition' &&
                           payRes.payment_error != '') {
                    // Just send the error back
                    res.status(400).json({ error: `${payRes.payment_error}` });
                  } else {
                    // Decrease balance by amount of invoice
                    song.balance = song.balance - amt;
                    song.save();
                    // Send payment info with new balance
                    res.status(200).json({
                      success: payRes,
                      balance: song.balance
                    });
                  }
                });
              }, 1000);
          });
        }).catch(err => {
          res.status(400).json({ error: 'Autopay failed' });
        });
    });
});

// @route   POST /plays/:id
// @desc    Increase song play count when played
// @access  Public
// @status  Working
router.post('/plays/:id', cors(corsOptions), (req, res) => {
  Song.findById(req.params.id)
    .then(song => {
      song.plays = parseInt(song.plays) + 1;
      song.save().then(() => res.json({ message: 'New play!' }));
    })
    .catch(err =>
      res.status(404).json({
        songnotfound: 'No song found'
      })
    );
});

// @route   POST /payout/:id
// @desc    Authorize payout for owner of song
//          decrease balance by amount on payment request
// @access  CORS with EC2 IP address

router.post('/payout/:id', cors(corsOptions), (req, res) => {
  const passcode = req.body.passcode;
  const payReq = req.body.pr;
  Song.findById(req.params.id)
    .then(song => {
      // Check passcode
      bcrypt.compare(passcode, song.passcode).then(isMatch => {
        if (isMatch) {
          // Make a request to LND API
          const decodePayReq = {
            pay_req: payReq
          };
          const paymentRequest = {
            payment_request: payReq
          };
          lightning.decodePayReq(decodePayReq, function (err, response) {
            const amt = parseInt(response.num_satoshis);
            amt > song.balance
              ? // Not enough loot
              res.status(404).json({ error: 'Insufficient funds' })
              : setTimeout(() => {
                lightning.sendPaymentSync(paymentRequest, function (err, payRes) {
                  // Check for routing errors
                  console.log(payRes);
                  if (amt === 0 || amt === null || amt === undefined) {
                    // Handle zero amount invoices
                    res.status(400).json({ error: 'Zero amount invoice not accepted' });
                  } else if (err) {
                    res.status(400).json({ error: `${err}` });
                  } else if (payRes.payment_error === 'payment is in transition') {
                    // Decrease balance by amount of invoice
                    song.balance = song.balance - amt;
                    song.save();
                    res.status(200).json({ error: `${payRes.payment_error}` });
                  } else if (payRes.payment_error !== 'payment is in transition' &&
                           payRes.payment_error != '') {
                    // Just send the error back
                    res.status(400).json({ error: `${payRes.payment_error}` });
                  } else {
                    // Decrease balance by amount of invoice
                    song.balance = song.balance - amt;
                    song.save();
                    // Send payment info with new balance
                    res.status(200).json({
                      success: payRes,
                      balance: song.balance
                    });
                  }
                });
              }, 1000);
          });
        } else {
          res.status(400).json({ error: 'Invalid passcode' });
        }
      });
    })
    .catch(err => {
      res.status(400).json({ error: 'Payout failed' });
    });
});

// @route   POST /owner/:id
// @desc    Add pubkey to permanent access
//          increase balance by 100, verify payment with lnd
// @access  Public
// @status  In progress
router.post('/owner/:id', cors(corsOptions), (req, res) => {
  Song.findById(req.params.id)
    .then(song => {
      song.owner.push(req.body.pubkey);
    })
    .catch(err =>
      res.status(404).json({
        songnotfound: 'No song found'
      })
    );
});

module.exports = router;
