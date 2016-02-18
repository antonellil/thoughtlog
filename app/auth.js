var express = require('express'),
    auth = express.Router();    
    
module.exports = function(passport, knex) {
    // FB auth
    auth.get('/auth/facebook', passport.authenticate('facebook'));
    
    auth.get('/auth/facebook/callback', passport.authenticate('facebook', { session: false }),
        function(req, res) {
            res.redirect('/home?authToken=' + req.user.authtoken + '&brainid=' + req.user.brainid);
        });
        
    // Login
    auth.get('/', function (req, res) {
        res.render('pages/index');
    });
    
    auth.get('/login', function (req, res) {
        res.render('pages/login');
    });
    
    // Authentication middleware
    auth.all(['/api/*', '/home'], function(req, res, next) {
        var authToken, 
            brainid,
            failure = function() {
                if(req.url.toLowerCase().indexOf('/api/') > -1) {
                    res.send({ unauthorized: true });
                } else {
                    res.redirect('/login');
                }
            };
        
        // Get the auth token and brainid
        if(req.method == 'POST') {
            authToken = req.body.authToken;
            brainid = req.body.brainid;
        }
        if (req.method == 'GET') {
            authToken = req.query.authToken;
            brainid = req.query.brainid
        }
        
        // Check authentication
        if(authToken !== undefined && brainid !== undefined) {
            knex('brains')
            .where({ brainid: brainid, authtoken: authToken })
            .first()
            .then(function(brain) {
                if(brain !== undefined && brain !== null && brain.brainid) {
                    next();
                } else {
                    failure();
                }
            }).catch(function(err) {
                failure();  
            });
        } else {
            failure();
        }
    });
    
    return auth;
};