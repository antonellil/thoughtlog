/* global $ */

(function() {
    window.ca$h = {
        mod: function(n, m) {
            return ((n % m) + m) % m;
        },
        get: function(config) {
            var data = {
                authToken: localStorage.getItem('authToken'),
                brainid: localStorage.getItem('brainid')
            };
            
            $.ajax({
                url: config.url,
                dataType: 'json',
                cache: false,
                data: data,
                success: function(response) {
                    if(response.unauthorized) {
                        window.location.replace('/login');
                        return;
                    }
                    config.success(response);
                },
                error: config.error
            });
        },
        post: function(config) {
            config.data.authToken = localStorage.getItem('authToken');
            config.data.brainid = localStorage.getItem('brainid');
        
            $.ajax({
                url: config.url, 
                type: 'POST', 
                contentType: 'application/json', 
                data: JSON.stringify(config.data),
                success: function(response) {
                    if(response.unauthorized) {
                        window.location.replace('/login');
                        return;
                    }
                    config.success(response);
                },
                error: config.error
            });
        }
    };
})();