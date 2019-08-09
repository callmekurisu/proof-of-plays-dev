/* Login to mongo with admin
   > mongo --port 27017 -u "user" -p "password" --authenticationDatabase "admin"
   Create and switch to new database
   > use "db name"
   Create database owner with
   > db.createUser({user: "user" , pwd: "password", roles: [  "dbOwner" ]})
*/
'use strict';

module.exports = {
  mongoURI:
    'mongodb://user:user@localhost:27017/plays-dev',
  superSecret: 'secret',
  DEV_CLIENT: 'http://localhost:3000'
};
