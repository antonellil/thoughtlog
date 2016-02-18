var express = require('express'),
    routes = express.Router(),
    uuid = require('uuid');    
    
module.exports = function(knex) {
    
    routes.get('/home', function (req, res) {
        res.render('pages/index', { authToken: req.query.authToken, brainid: req.query.brainid });
    });
    
    // Logout
    routes.get('/logout', function (req, res) {
        knex('brains')
            .where({ authtoken: req.query.authToken, brainid: req.query.brainid })
            .update({ authtoken: uuid.v4() })
            .then(function(){
                res.send({ success: true });
            }).catch(function(err){
                res.send({ success: false });
            });
    });

    return routes;  
};

