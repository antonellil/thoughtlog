var express = require('express'),
    _ = require('lodash'),
    api = express.Router();
    
module.exports = function(knex) {
    
    // Common queries
    var queries = {
        recentThoughts: knex('thoughts').select().limit(10).orderBy('datecreated', 'desc'),
        themes: knex.max('content as content')
                    .from('themes')
                    .leftOuterJoin('thoughtthemes', 'themes.themeid', 'thoughtthemes.themeid')
                    .groupBy('themes.themeid')
                    .orderByRaw('COUNT(*) DESC')
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
        var content = decodeURI(req.body.content),
            themeContents = content.match(/\B#\w\w+/g).map(function(theme) { return theme.slice(1); }),
            themes = themeContents.map(function(v, i) { 
                return { 
                    content: v,
                    datecreated: new Date()
                };
            }),
            existingThemeIds, themeIds, recentThoughts;
        
        knex('themes')
            .select()
            .whereIn('content', themeContents)
            .then(function (rows) {
                var existingThemes = _.map(rows, 'content'),
                    newThemes = _.filter(themes, function(theme) { 
                        return existingThemes.indexOf(theme.content) === -1; 
                    });
                
                existingThemeIds = _.map(rows, 'themeid'); // Store the existing themes
                
                return knex('themes').insert(newThemes, 'themeid'); // Insert only new themes, return new themeids
            })
            .then(function (returning) {
                themeIds = returning && returning.length 
                    ? returning.concat(existingThemeIds) // Store all the theme ids for this thought
                    : existingThemeIds;
                
                return knex('thoughts')
                    .insert({ 
                        content: req.body.content, 
                        brainid: req.body.brainid, 
                        datecreated: new Date() 
                    }, 'thoughtid');
            })
            .then(function (rows) {
                var thoughtThemes = themeIds.map(function(v, i) {
                    return { thoughtid: rows[0], themeid: v };
                });
                
                return knex('thoughtthemes').insert(thoughtThemes);
                
            })
            .then(function() {
                return queries.recentThoughts; // Get recent thoughts
            })
            .then(function (rows) {
                recentThoughts = rows; // Store recent thoughts
                return queries.themes; // Get all themes
            })
            .then(function (rows) {
                res.json({ recentThoughts: recentThoughts, themes: rows });
            })
            .catch(function (err) {
                console.log(err);
                res.json({ error: err });
            })
    });

    api.get('/api/themes/getAll', function (req, res) {

        // Get all themes
        queries.themes
            .then(function (rows) {
                res.json(rows);
            })
            .catch(function (err) {
                res.json({ error: err });
                console.log(err);
            })
    });
    
    return api;
};