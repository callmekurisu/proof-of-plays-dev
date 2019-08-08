const express = require('express');
const path = require('path');
const app = express();
const fs = require('fs');

app.use(express.static(path.join(__dirname, 'build')));

require('events').EventEmitter.defaultMaxListeners = Infinity;
const nocache = require('nocache')
app.use(nocache());


// start ssl verification
const  options = {
                    key: fs.readFileSync('./server.pem', 'utf8'),
                    cert: fs.readFileSync('./certificate.crt', 'utf8')
}

/*
app.get('/.well-known/acme-challenge/VR1sfxCJLzxRLiaeT1J4AtmkxndAGgUm1gEK3jSXbmA',function (req, res){
  res.send("VR1sfxCJLzxRLiaeT1J4AtmkxndAGgUm1gEK3jSXbmA.QgXU7nWPW5lhASTa0y07ndtwIpJE0b-XuxF0Fb8G0t0")
});
*/
const httpsPort = 443;
const http = require('http');
const https = require('https');
const forceSsl = require('express-force-ssl');
// app.use(forceSsl);
// Don't forget to redirect port 443
const secureServer = https.createServer(options, app).listen(httpsPort, () => {
  console.log(">> PoP Client is listening in the interwebz...");
});

app.get('/ui/*', function (req, res) {
   res.sendFile(path.join(__dirname, 'build', 'index.html'));
 });

/* For http and ssl verification
const port = 9999
app.listen(port, '0.0.0.0', () => console.log(`Port ${port} is online`))
*/