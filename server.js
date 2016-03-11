// Set up ====================================================================================
var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    pgConnectionString = process.env.RDS_HOSTNAME
        ? 'postgres://'
            + process.env.RDS_USERNAME
            + ':' + process.env.RDS_PASSWORD
            + '@' + process.env.RDS_HOSTNAME  
            + ':' + process.env.RDS_PORT 
            + '/' + process.env.RDS_DB_NAME
        : 'postgres://localhost:5432/louisantonelli',
    knex = require('knex')({ // Rivals legos for best childrens toy ever
        client: 'pg',
        connection: pgConnectionString,
        searchPath: 'knex,public'
    }),
    passport = require('./app/passportSetup')(knex),
    port = process.env.PORT || 3000;

// App configuration =========================================================================
app.set('view engine', 'ejs'); // Set ejs for templating
app.use('/bower_components', express.static(__dirname + '/bower_components')); // Bower components
app.use('/scripts', express.static(__dirname + '/scripts')); // Scripts
app.use('/public', express.static(__dirname + '/public')); // CSS
app.use(bodyParser.json()); // for parsing application/json
app.use(passport.initialize());

// Auth routes and middleware
app.use(require('./app/auth.js')(passport, knex));

// Site routes ===============================================================================
app.use(require('./app/routes.js')(knex));

// Api routes ================================================================================
app.use(require('./app/api.js')(knex));

// Start server ==============================================================================
app.listen(port, function () {
    console.log(pgConnectionString);
    console.log('Example app listening on port ' + port);
});

// Dev only ==================================================================================
var livereload = require('livereload');
var server = livereload.createServer();
server.watch([__dirname + "/public", __dirname + "/scripts"]);