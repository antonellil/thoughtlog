var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    knex = require('knex')({ // Rivals legos for best childrens toy ever
        client: 'pg',
        connection: process.env.DATABASE_URL || 'postgres://localhost:5432/louisantonelli',
        searchPath: 'knex,public'
    }),
    passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy,
    session = require('express-session'),
    uuid = require('uuid'),
    sha1 = require('sha1');

// App configuration
app.use('/bower_components', express.static(__dirname + '/bower_components')); // Bower components and static
app.use('/scripts', express.static(__dirname + '/scripts')); // Bower components and static
app.use('/public', express.static(__dirname + '/public')); // Bower components and static
app.use(bodyParser.json()); // for parsing application/json
app.use(passport.initialize());
app.use(session({
  genid: function(req) {
    return uuid.v1();
  },
  secret: 'keyboard cat',
  saveUninitialized: true,
  resave: false
}))

// App setup
app.set('view engine', 'ejs'); // Set ejs for templating

// Set up passport
passport.use(new FacebookStrategy({
    clientID: 974780915923162,
    clientSecret: '067675629c9525761c1bb33139856cd9',
    callbackURL: "http://localhost:3000/auth/facebook/callback"
},
function (accessToken, refreshToken, profile, done) {
    
    // Get or create brain, update app auth token and fb auth token 
    knex('brains')
        .where({ brainid: profile.id })
        .first()
        .then(function(brain) {
            
            // Update auth and fb auth token if user exists
            if(brain) {
                return knex('brains')
                    .returning('brainid')
                    .where({ brainid: brain.brainid })
                    .update({ auth: sha1(brain.brainid + Date.now()), fbauth: accessToken });
            } 
            
            // Create user if not exist
            return knex('brains')
                .returning('brainid')
                .insert({ 
                    brainid: profile.id,
                    name: profile.displayName,
                    fbauth: accessToken,
                });
        })
        .then(function(rows){
            return knex('brains').where({ brainid: rows[0] }).first();
        })
        .then(function(brain){
            done(null, brain);
        })
        .catch(function(err){
            done(err);
        });
}));

// Site routes
app.get('/', function (req, res) {
    res.render('pages/index');
});

// Common queries
var queries = {
    recentThoughts: knex('thoughts').select().limit(10).orderBy('datecreated', 'desc')
};

// Api routes
app.get('/api/thoughts/recent', function (req, res) {
    
    // Get 10 most recent thoughts
    queries
        .recentThoughts
        .then(function (rows) {
            res.json(rows);
        })
        .catch(function (err) {
            res.json({ error: err });
        })
});

app.post('/api/thoughts/submit', function (req, res) {
    console.log(req.auth);
    
    // Insert new thought and return most recent 10
    knex('thoughts')
        .insert({ content: req.body.content, brainid: req.body.brainid, datecreated: new Date() })
        .then(function (rows) {
            return queries.recentThoughts;
        })
        .then(function (rows) {
            res.json(rows);
        })
        .catch(function (err) {
            res.json({ error: err });
        })
});

app.get('/api/themes/getAll', function (req, res) {

    // Get all themes
    knex('themes')
        .select()
        .then(function (rows) {
            res.json(rows);
        })
        .catch(function (err) {
            res.json({ error: err });
        })
});

// Auth
app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback', passport.authenticate('facebook', { session: false }),
    function(req, res) {
        console.log(req.user);
        res.redirect('/');
    });

app.get('/login', function (req, res) {
    res.render('pages/login');
});

// Start server
app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

// Dev
var livereload = require('livereload');
var server = livereload.createServer();
server.watch([__dirname + "/public", __dirname + "/scripts"]);