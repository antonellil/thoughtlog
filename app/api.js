var express = require('express'),
    _ = require('lodash'),
    words = require('./words.js'),
    api = express.Router();
    
module.exports = function(knex) {
    
    // Common queries
    var queries = {
        recentThoughts: function(brainid) {
            return knex('thoughts')
                    .select()
                    .where({ brainid: brainid, datedeleted: null })
                    .limit(100)
                    .orderBy('datecreated', 'desc')
        },
        themes: function(brainid) { 
                return knex.max('content as content')
                    .from('themes')
                    .where({ brainid: brainid })
                    .leftOuterJoin('thoughtthemes', 'themes.themeid', 'thoughtthemes.themeid')
                    .groupBy('themes.themeid')
                    .orderByRaw('COUNT(*) DESC');
        }
    };
    
    api.get('/api/thoughts/recent', function (req, res) {
        
        // Get 10 most recent thoughts
        queries.recentThoughts(req.query.brainid)
            .then(function (rows) {
                res.json(rows);
            })
            .catch(function (err) {
                res.json({ error: err });
            })
    });

    api.post('/api/thoughts/submit', function (req, res) {
        var content = decodeURI(req.body.content),
            cleanedContentPieces = content.replace(/[^A-Za-z0-9\s]/g,"").trim().toLowerCase().split(/\s+/),
            themeContents = _.filter(_.uniq(cleanedContentPieces), theme => words.stopWords.indexOf(theme.toLowerCase()) === -1),
            themes = themeContents ? themeContents.map(function(v, i) {
                return { 
                    content: v,
                    datecreated: new Date(),
                    brainid: req.body.brainid
                };
            }) : null,
            existingThemeIds = [], themeIds = [], recentThoughts;
        
        knex('themes')
            .select()
            .whereIn('content', _.map(themes, 'content'))
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
                return queries.recentThoughts(req.body.brainid); // Get recent thoughts
            })
            .then(function (rows) {
                recentThoughts = rows; // Store recent thoughts
                return queries.themes(req.body.brainid); // Get all themes
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
        queries.themes(req.query.brainid)
            .then(function (rows) {
                res.json(rows);
            })
            .catch(function (err) {
                res.json({ error: err });
                console.log(err);
            })
    });
    
    api.post('/api/thought/explore', function (req, res) {
           
        // Explore thought
        knex.raw(`
                select tts2.thoughtid as thoughtid, max(t.content) as content, max(t.datecreated) as datecreated
                    from thoughtthemes tts1
                    join thoughtthemes tts2
                        on tts1.themeid = tts2.themeid
                    join thoughts t
                        on tts2.thoughtid = t.thoughtid
                    where tts1.thoughtid = :thoughtid
                        and tts2.thoughtid != :thoughtid
                    group by tts2.thoughtid
                    order by COUNT(tts2.thoughtid) desc, datecreated desc
            `, { thoughtid: req.body.thoughtid })
            .then(function(result) {
                res.json(result.rows);
            })
            .catch(function(err) {
                console.log(err);
            });
    });
    
    api.post('/api/search', function (req, res) {
        knex('themes')
            .distinct('thoughts.thoughtid')
            .select('thoughts.thoughtid', 'thoughts.content', 'thoughts.datecreated')
            .where('thoughts.datedeleted', null)
            .where(function() {
                _.forEach(req.body.searchTerms, function(term, index) {
                    if(index === 0) {
                        this.where('themes.content', 'like', term + '%')
                    } else {
                        this.orWhere('themes.content', 'like', term + '%'); 
                    }
                }.bind(this));
            })
            .leftJoin('thoughtthemes', 'themes.themeid', 'thoughtthemes.themeid')
            .leftJoin('thoughts', 'thoughtthemes.thoughtid', 'thoughts.thoughtid')
            .orderBy('thoughts.datecreated', 'desc')
            .then(function(rows) {
                res.json(_.filter(rows, 'thoughtid'));
            })
            .catch(function (err) {
                res.json({ error: err });
                console.log(err);
            });
    });
    
    api.post('/api/thought/delete', function (req, res) {

        // Delete thought
        knex('thoughtthemes')
            .where({ thoughtid: req.body.thoughtid })
            .del()
            .then(function(rows) {
                return knex('thoughts')
                    .where({ thoughtid: req.body.thoughtid })
                    .update({ datedeleted: new Date() })
            })
            .then(function(rows) {
                res.json(rows);
            })
            .catch(function (err) {
                res.json({ error: err });
                console.log(err);
            })
    });
    
    return api;
};