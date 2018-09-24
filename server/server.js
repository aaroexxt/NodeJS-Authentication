//npm modules
const express = require('express');
const uuid = require('uuid/v4');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const users = [
  {id: '2f24vvg', email: 'test@test.com', password: 'password'}
]

const findUserByEmail = email => {
    for (var i=0; i<users.length; i++) {
        if (users[i].email && users[i].email == email) {
            return users[i];
        }
    }
    return null;
}

// configure passport.js to use the local strategy
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  (email, password, done) => {
    console.log('Passport localStrategy found, looking up user w/email: '+email+", passwd: "+password);
    var user = findUserByEmail(email);
    if (user && user.password == password) {
        console.log("User found & validated");
        return done(null, user)
    } else {
        console.log("No user found");
        return done(null, false, { "message": "No user found" });
    }
  }
));

// tell passport how to serialize the user
passport.serializeUser((user, done) => {
  console.log('Inside serializeUser callback. User id is save to the session file store here')
  done(null, user.id);
});

// create the server
const app = express();

// add & configure middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(session({
    genid: (req) => {
        console.log('Inside UUID-generation');
        return uuid(); // use UUIDs for session IDs
    },
    store: new FileStore(),
    secret: "keyCat", //set secret to new ID
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// create the homepage route at '/'
app.get('/', (req, res) => {
    console.log('Inside GET request on /, sessID: '+req.sessionID);
    res.send(`You hit home page!\n`)
});

// create the login get and post routes
app.get('/login', (req, res) => {
    console.log('Inside GET request on /login, sessID: '+req.sessionID);
    res.send(`You hit login page!\n`)
})

app.post('/login', (req, res, next) => {
    console.log('Inside POST request on /login, sessID: '+req.sessionID)
    passport.authenticate('local', (err, user, info) => {
        if(info) {return res.send(info.message)}
        console.log('Inside passport.authenticate() callback');
        console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`)
        console.log(`req.user: ${JSON.stringify(req.user)}`)
        req.login(user, (err) => {
            console.log('Inside req.login() callback')
            console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`)
            console.log(`req.user: ${JSON.stringify(req.user)}`)
            return res.send('You were authenticated & logged in!\n');
        })
    })(req, res, next);
})

// tell the server what port to listen on
app.listen(3000, () => {
    console.log('Listening on localhost:3000')
})