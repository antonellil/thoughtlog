var Login = React.createClass({
    login: function() {
        ca$h.post({
            url: '/auth/facebook',
            data: {},
            success: function(response) {
                console.log(response);
            }, 
            error: function() {
                alert("There was an error logging in.");
            }
        });
    },
    render: function() {
        return (
            <div className="login-wrapper">
                <a href="/auth/facebook" className="login-button">Login with Facebook</a>
            </div>
        );
    }
});

ReactDOM.render(
  <Login />,
  $('.login-react')[0]
);