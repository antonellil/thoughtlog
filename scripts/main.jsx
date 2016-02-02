var Thought = React.createClass({
  render: function() {
    return (
      <div className="thought">
        <h3 className="thought-id">
          {this.props.id}
        </h3>
        
        <h3 className="thought-datetime">
          {this.props.datetime}
        </h3>
        
        {this.props.children}
      </div>
    );
  }
});

var RecentThoughts = React.createClass({
    loadThoughtsFromServer: function() {
        $.ajax({
            url: this.props.url,
            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({ data: data });
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    getInitialState: function() {
        return { data: [] };
    },
    componentDidMount: function() {
        this.loadThoughtsFromServer();
    },
    render: function() {
        var thoughtNodes = this.state.data.map(function(thought, i) {
            var thoughtDateCreated = moment(thought.datecreated).format("M/D/YY h:ma");
            return (
                <Thought id={thought.thoughtid} key={thought.thoughtid} datetime={thoughtDateCreated} >
                    {thought.content}
                </Thought>
            );
        });
        return (
            <div className="thought-wrapper">
                <h1>Recent Thoughts</h1>
                <div className="thought-list">
                    {thoughtNodes}
                </div>
            </div>
        );
    }
});

ReactDOM.render(
  <RecentThoughts url="/api/thoughts" />,
  $('#content')[0]
);