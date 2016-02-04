var Thought = (props) => 
    <div className="thought">
        <div className="thought-content">
            {props.children}
        </div>
        <span className="thought-datetime">
            {props.datetime}
        </span>
    </div>;

var RecentThoughts = (props) =>
    <div className="recent-thoughts-wrapper">
        <h3>Recent thoughts</h3>
        <div className="thought-list">
            {props.thoughts}
        </div>
    </div>;

var ThoughtBox = React.createClass({
    loadTagsFromServer: function() {
        $.get('/api/tags/getAll', { }, function(data){
            this.setState({ tags: data });
        }.bind(this));
    },
    submitThought: function() {
        if(this.state.content === '') {
            this.setState({ error: true });
            return;
        }
        
        $.ajax({
            url: '/api/thoughts/submit', 
            type: 'POST', 
            contentType: 'application/json', 
            data: JSON.stringify({ content: encodeURI(this.state.content.trim()) }),
            success: function(data) {
                this.setState({ content: "", hashMode: false });
                this.props.onThoughtSubmitted();
            }.bind(this),
        });
    },
    handleChange: function(e){
        this.setState({ content: e.target.value });
    },
    handleEnter: function(e) {
        if( e.keyCode == 13 ) {
            this.submitThought();
        }
    },
    handleHashMode: function(e) {
        var coords = getCaretCoordinates($(e.target)[0], e.target.selectionEnd),
            leftModifier = e.keyCode === 8 ? -8 : 0,
            lastResult = /\S+$/.exec(e.target.value.slice(0, e.target.selectionEnd)),
            lastWord = lastResult ? lastResult[0] : null;
            
        this.setState({ 
            caretTop: coords.top, 
            caretLeft: coords.left + leftModifier,
            hashMode: lastWord ? lastWord.indexOf('#') > -1 : false
        });
    },
    getInitialState: function() {
        return { 
            content: "", 
            tags: [],
            hashMode: false
        };
    },
    componentDidMount: function() {
        this.loadTagsFromServer();
    },
    render: function() {
        var tagBoxStyle = { 
            left: this.state.caretLeft,
            top: this.state.caretTop,
            display: this.state.hashMode ? 'block' : 'none'
        };
                
        return (
            <div className="thought-box-wrapper">
                <textarea 
                    className="thought-textarea" 
                    placeholder="Solid #workout, 8 rep 185 bench, 8 rep 205 bench, 7 rep 225 bench"
                    value={this.state.content}
                    onChange={this.handleChange}
                    onKeyDown={this.handleOnKeyDown}
                    onKeyUp={this.handleHashMode}></textarea>
                
                <div 
                    className="tag-box" 
                    style={tagBoxStyle}></div>
            </div>
        );
    }
});

var ThoughtLog = React.createClass({
    getInitialState: function() {
        return { thoughts: [] };
    },
    componentDidMount: function() {
        this.loadRecentThoughtsFromServer();
    },
    loadRecentThoughtsFromServer: function() {
        $.ajax({
            url: '/api/thoughts/recent',
            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({ thoughts: data });
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    render: function() {
        var thoughtNodes = this.state.thoughts.map(function(thought, i) {
            var thoughtDateCreated = moment(thought.datecreated).format('h:mA - M/D/YY');
            return (
                <Thought id={thought.thoughtid} key={thought.thoughtid} datetime={thoughtDateCreated} >
                    {thought.content}
                </Thought>
            );
        });
        
        return (
            <div className="thought-log">
                <ThoughtBox onThoughtSubmitted={this.loadRecentThoughtsFromServer}></ThoughtBox>
                <RecentThoughts thoughts={thoughtNodes}></RecentThoughts>
            </div>
        );
    }
});

ReactDOM.render(
  <ThoughtLog />,
  $('#thought-log-wrapper')[0]
);