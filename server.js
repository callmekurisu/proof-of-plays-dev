const keys = require('./config/keys');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fs = require('fs');
const meta = require('./routes/api/meta');
const audio = require('./routes/api/audio');
const lnd = require('./routes/api/lnd');

const app = express();
require('events').EventEmitter.defaultMaxListeners = Infinity;
// This app requires cors, change for local testing to DEV_CLIENT
const cors = require('cors');
const corsOptions = {
 origin: keys.DEV_CLIENT,
 optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions));
// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// DB config
const db = require('./config/keys').mongoURI;

// Connect to MongoDB
// mongoose
//   .connect(db, { useNewUrlParser: true })
//   .then(() => console.log('Mongoose Connected'))
//   .catch(err => console.log(err));

// Routes
app.use('/api/meta', meta);
app.use('/api/audio', audio);
app.use('/api/lnd', lnd);

// localhost testing
const port = 7777;
app.listen(port, '0.0.0.0', () => console.log(`Port ${port} is online`));
