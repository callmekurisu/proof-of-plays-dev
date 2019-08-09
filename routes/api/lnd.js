const grpc = require('grpc');
const fs = require("fs");
const express = require('express');
const router = express.Router();
const cors = require('cors');
const cmd = require('node-cmd');
require('events').EventEmitter.defaultMaxListeners = Infinity;
// Due to updated ECDSA generated tls.cert we need to let gprc know that
// we need to use that cipher suite otherwise there will be a handhsake
// error when we communicate with the lnd rpc server.
process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA'

//  Lnd cert is at ~/.lnd/tls.cert on Linux and
//  ~/Library/Application Support/Lnd/tls.cert on Mac
const lndCert = fs.readFileSync("../../config/tls.cert");
const sslCreds = grpc.credentials.createSsl(lndCert);
const macaroonCreds = grpc.credentials.createFromMetadataGenerator(function(args, callback) {
    const macaroon = fs.readFileSync("../../config/admin.macaroon").toString('hex');
    const metadata = new grpc.Metadata()
    metadata.add('macaroon', macaroon);
    callback(null, metadata);
  });
//credentials for lightning network node
const creds = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
const credentials = grpc.credentials.createSsl(lndCert);
const lnrpcDescriptor = grpc.load("rpc.proto");
const lnrpc = lnrpcDescriptor.lnrpc;
const lightning = new lnrpc.Lightning('localhost:10009', creds);

//add http://localhost:3000 when testing locally
const whitelist = ['https://pop-server.hopto.org', 'https://proof-of-plays.com',
                 'https://proofofplays.hopto.org', 'http://proofofplays.hopto.org','http://proof-of-plays.com', 'http://localhost:3000']

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

// Node Info
router.get('/', cors(corsOptions), (req, res) => {
  lightning.getInfo({}, (err, response) => {
    res.send(response);
  })
});

// Get the balance of the lightning node
router.get('/balance', cors(corsOptions), (req, res) => {
  lightning.channelBalance({}, (err, response) => {
    res.send(response)
  });
});

// Generate invoices
router.get('/invoice/:memo/:value', cors(corsOptions), (req, res) => {
  data = req.params
  value = data.value
  memo = data.memo

  let request = {
      memo: memo,
      value: value,
  }

  lightning.addInvoice(request, (err,response) => {
    let invoice = response.payment_request;
    lightning.decodePayReq(invoice, function(err, response){
      let hash = response.payment_hash;
        res.send(`{"invoice":"${invoice}", "hash":"${hash}"}`);
     });
  });
});

// Listen for payment
router.get('/listen/:payReq', cors(corsOptions), (req, res) => {
  data = req.params
  payReq = data.payReq

 let call = lightning.subscribeInvoices()
  call.on('data', function(response) {
    // A response was received from the server.
    if(response.payment_request === payReq){
      res.send(response)
    }
  });
  call.on('status', function(status) {
    // The current status of the stream.
  });
  call.on('end', function() {
    // The server has closed the stream.
  });
});

module.exports = router;