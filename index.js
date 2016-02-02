var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/louisantonelli';
var express = require('express');
var app = express();

// Set ejs for templating
app.set('view engine', 'ejs');  

// Bower components
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use('/scripts',  express.static(__dirname + '/scripts'));


app.get('/', function (req, res) {
    res.render('pages/index');
});

app.get('/api/thoughts', function (req, res) {
  var p = new Promise(function(resolve, reject) {
    var client = new pg.Client(connectionString);
    client.connect();
    client.query('SELECT * FROM thoughts ORDER BY datecreated DESC', function(err, result) {
        if(err) {
            client.end();
            console.error(err);
            reject("error");
            return;
        }
        
        resolve(result.rows);
        
        client.end();
    });
    });

    // Resolve promise
    p.then(function(data) { 
        res.json(data); 
    })
    .catch(function(reason) { 
        res.json({ error: reason });
    });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

