var express = require('express');
var passport = require('passport');
var Strategy = require('passport-http').DigestStrategy;
var db = require('./db');


// Configure the Digest strategy for use by Passport.
//
// The Digest strategy requires a `secret`function, which is used to look up
// user.  The function must invoke `cb` with the user object as well as the
// user's password as known by the server.  The password is used to compute a
// hash, and authentication will fail if the computed value does not match that
// of the request.  The user object will be set at `req.user` in route handlers
// after authentication.
passport.use(new Strategy(
  function(username, cb) {
    db.users.findByUsername(username, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      return cb(null, user, user.password);
    })
  }));


// Create a new Express application.
var app = express();

// Configure Express application.
app.configure(function() {
  app.use(express.logger());
});

app.get('/',
  passport.authenticate('digest', { session: false }),
  function(req, res) {
    res.json({ username: req.user.username, email: req.user.emails[0].value });
  });
  
// curl -v --user jack:secret --digest "http://127.0.0.1:3000/hello?name=World&x=y"
app.get('/hello',
  passport.authenticate('digest', { session: false }),
  function(req, res) {
    res.json({ message: 'Hello, ' + req.query.name, from: req.user.username });
  });
  
// curl -v -d "name=World" --user jack:secret --digest http://127.0.0.1:3000/hello
app.post('/hello',
  passport.authenticate('digest', { session: false }),
  express.bodyParser(),
  function(req, res) {
    res.json({ message: 'Hello, ' + req.body.name, from: req.user.username });
  });

app.listen(3000);
