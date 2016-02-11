var Login = (props) => 
    <div className="login-wrapper">
           <a href="/auth/facebook">Login with Facebook</a>
    </div>;

ReactDOM.render(
  <Login />,
  $('#thought-log-login')[0]
);