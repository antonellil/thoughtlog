var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/louisantonelli';
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.set('view engine', 'ejs'); // Set ejs for templating

app.use(bodyParser.json()); // for parsing application/json

// Bower components
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use('/scripts', express.static(__dirname + '/scripts'));
app.use('/public', express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.render('pages/index');
});

app.get('/api/thoughts/recent', function (req, res) {
    var client = new pg.Client(connectionString);
    client.connect();
    client.query('SELECT * FROM thoughts ORDER BY datecreated DESC LIMIT 10',
        function (err, result) {
            client.end();
            if (err) {
                res.json({ error: err });
            } else {
                res.json(result.rows.map(function(row){
                    row.content = decodeURI(row.content);
                    return row;
                }));
            }
        });
});

app.post('/api/thoughts/submit', function (req, res) {
    var client = new pg.Client(connectionString),
        insertQueryString = 'INSERT INTO thoughts(content, brainid, datecreated) VALUES($1, 1, $2)',
        recentQueryString = 'SELECT * FROM thoughts ORDER BY datecreated DESC LIMIT 10';
        
    client.connect();
    client.query(insertQueryString, [req.body.content, new Date()]);
    client.query(recentQueryString,
        function (err, result) {
            client.end();
            if (err) {
                res.json({ error: err });
            } else {
                res.json(result.rows.map(function(row){
                    row.content = decodeURI(row.content);
                    return row;
                }));
            }
        });
});

app.get('/api/themes/getAll', function (req, res) {
    var client = new pg.Client(connectionString);
    client.connect();
    client.query('SELECT * FROM themes',
        function (err, result) {
            client.end();
            if (err) {
                res.json({ error: err });
            } else {
                res.json(result.rows);
            }
        });
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

// Dev
var livereload = require('livereload');
var server = livereload.createServer();
server.watch([__dirname + "/public", __dirname + "/scripts"]);