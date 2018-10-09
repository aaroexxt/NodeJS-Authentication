//npm modules
const express = require('express');
const uuid = require('uuid/v4');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const CustomStrategy = require('passport-custom').Strategy;

const bcrypt = require('bcrypt');

const users = [
  {id: '2f24vvg', email: 'test@test.com', password: '$2a$10$94vHzy2wUcdNdXOFjbQWHOgyq.Ewc1x.Rjme4htmTisaLmH7S7rra'} //hashed password
]

const faceOK = [
    {id: ''}
]

const findUserByEmail = email => {
    for (var i=0; i<users.length; i++) {
        if (users[i].email && users[i].email == email) {
            return users[i];
        }
    }
    return null;
}
const findUserByID = id => {
    for (var i=0; i<users.length; i++) {
        if (users[i].id && users[i].id == id) {
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
    if (user && user.password) {
        console.log("User found, matching password to bcrypt hash "+user.password);
        if (bcrypt.compareSync(password, user.password)) {
            console.log("Bcrypt ok");
            return done(null, user)
        } else {
            console.log("Bcrypt not ok");
            return done(null, true, { message: 'Invalid credentials.\n' });
        }
    } else {
        console.log("No user found or it is undefined");
        return done(null, true, { "message": "Invalid credentials." });
    }
  }
));

passport.use('openCV', new CustomStrategy( function(req, done) {
    console.log("DOING CV SHIT");
    done(null, users[0]);
}))
// tell passport how to serialize the user
passport.serializeUser((user, done) => {
  console.log('Inside serializeUser callback. User id is save to the session file store here')
  done(null, user.id);
});

passport.deserializeUser((id, done) => { //i.e. find user by id
  console.log('Inside deserializeUser callback, looking up user by id='+id);
  let user = findUserByID(id);
  console.log("Found user object: "+JSON.stringify(user))
  if (user === null || typeof user == "undefined") {
    user = false;
  } 
  done(null, user);
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
    if (req.isAuthenticated()) {
        res.redirect("/authrequired");
    } else {
        res.send(`You hit login page!\n<form action="/loginRegular" method="post">Email:<br><input type="text" name="email"><br>Password:<br><input type="text" name="password"><br><input type="submit" value="Submit"></form>`)
    }
})

app.get('/loginRegular', (req, res, next) => {
    res.redirect("/login");
});
app.post('/loginRegular', (req, res, next) => {
    console.log('Inside POST request on /loginRegular, sessID: '+req.sessionID)
    passport.authenticate('local', (err, user, info) => {
        if(info) {return res.send(info.message)}
        if (err) { return next(err); }
        if (!user) { return res.redirect('/login'); }
        req.login(user, (err) => {
          if (err) { return next(err); }
          console.log("You were authenticated :)")
          return res.redirect('/authrequired');
        })
    })(req, res, next);
})

app.get('/loginCV', (req, res, next) => {
    res.redirect("/login");
});
app.post('/loginCV', (req, res, next) => {
    console.log('Inside POST request on /loginCV, sessID: '+req.sessionID)
    passport.authenticate('openCV', (err, user, info) => {
        if(info) {return res.send(info.message)}
        if (err) { return next(err); }
        if (!user) { return res.redirect('/login'); }
        req.login(user, (err) => {
          if (err) { return next(err); }
          console.log("You were authenticated :)")
          return res.redirect('/authrequired');
        })
    })(req, res, next);
})

app.get('/authrequired', (req, res) => {
  console.log('Inside GET /authrequired callback')
  console.log(`User authenticated? ${req.isAuthenticated()}`)
  if(req.isAuthenticated()) {
    res.send('You are logged in :)\n')
  } else {
    res.redirect('/login')
  }
})

// tell the server what port to listen on
app.listen(3000, () => {
    console.log('Listening on localhost:3000')
})