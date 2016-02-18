var express = require('express'),
    api = express.Router();    
    
module.exports = function(knex) {
    
    // Common queries
    var queries = {
        recentThoughts: knex('thoughts').select().limit(10).orderBy('datecreated', 'desc')
    };
    
    api.get('/api/thoughts/recent', function (req, res) {
        
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

    api.post('/api/thoughts/submit', function (req, res) {
        
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

    api.get('/api/themes/getAll', function (req, res) {

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
    
    return api;
};