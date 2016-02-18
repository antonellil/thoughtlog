var passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy,
    uuid = require('uuid'),
    setup = function(knex) {
        // Set up passport
        passport.use(new FacebookStrategy({
                clientID: 974780915923162,
                clientSecret: '067675629c9525761c1bb33139856cd9',
                callbackURL: "http://localhost:3000/auth/facebook/callback",
                profileFields: ['name', 'email', 'picture']
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
                                .update({ authtoken: uuid.v4(), fbauth: accessToken });
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
            
        return passport;
    };

// Make it accessible
module.exports = function(knex) {
    return setup(knex);
};