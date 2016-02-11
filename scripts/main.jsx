window.mod = function(n, m) {
        return ((n % m) + m) % m;
};

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
        <h3>Recent</h3>
        <div className="thought-list">
            {props.thoughts}
        </div>
    </div>;

var Explore = React.createClass({
    getInitialState: function() {
        return { };
    },
    componentDidMount: function() {
        return;
    },
    render: function() {
        return (
            <div className="explore-wrapper">
                <h3>Explore</h3>
                <div className="explore-results"></div>
            </div>
        );
    }
});

var ThoughtBox = React.createClass({
    loadTagsFromServer: function() {
        $.get('/api/themes/getAll', { }, function(data){
            this.setState({ allThemes: data });
        }.bind(this));
    },
    submitThought: function(e) {
        if(this.state.content.trim() == '') {
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
                this.props.onThoughtSubmitted(data);
            }.bind(this),
            error: function(err) {
                console.log(err);
            }
        });
    },
    handleChange: function(e){
        // Auto grow textarea with the content
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight+'px';
        
        // Update state
        this.setState({ content: e.target.value });
    },
    handleHashMode: function(e, themeOptions, selectedTheme) {
        // Down or up arrow
        if(e.keyCode === 40 || e.keyCode === 38 || e.keyCode === 9) {
            selectedTheme += e.keyCode === 40 || e.keyCode === 9 ? 1 : -1;
        }
            
        // Check selected theme bounds
        return mod(selectedTheme, themeOptions.length);
    },
    handleKeyDown: function(e) {
        // Prevent default in hash mode for enter, down, up, tab
        if(this.state.hashMode) {
            if(e.keyCode === 13 || e.keyCode === 9 || e.keyCode === 40 || e.keyCode === 38) {
                e.preventDefault();
            }
        }  
    },
    handleKeyUp: function(e) {
        var coords = getCaretCoordinates($(e.target)[0], e.target.selectionEnd),
            leftModifier = e.keyCode === 8 ? -8 : 0, // Backspace
            lastResult = /\S+$/.exec(e.target.value.slice(0, e.target.selectionEnd)),
            lastTheme = lastResult ? lastResult[0] : null,
            lastWord = lastTheme ? lastTheme.slice(1).toLowerCase() : null,
            themeOptions = _.filter(this.state.allThemes, function(theme) {
                    return lastTheme 
                        ? theme.content.indexOf(lastWord) === 0 // Starts with the typed word
                            && theme.content.length !== lastWord.length // If user typed full word, remove
                        : false;
                }),
            hashMode = lastTheme && themeOptions.length > 0
                ? lastTheme.indexOf('#') > -1 && e.keyCode !== 27 // Escape
                : false,
            content = e.target.value,
            selectedTheme = hashMode ? this.state.selectedTheme : 0;
        
        // Enter to submit thought when not in hash mode
        if(e.keyCode === 13 && e.shiftKey && !hashMode) {
            this.submitThought();
            e.target.style.height = 60+'px'; // Reset height after submission
        }
        
        // Handle hash mode
        if(hashMode) {
            // Enter key to selected theme
            if(e.keyCode === 13) {
                content = e.target.value.slice(0, lastResult.index + 1)
                    + themeOptions[selectedTheme].content 
                    + " " // Space after theme entered
                    + e.target.value.slice(lastResult.index + 1 + lastWord.length);
                hashMode = false;
            } else {
                selectedTheme = this.handleHashMode(e, themeOptions, selectedTheme);
            }
        }
        
        this.setState({ 
            caretTop: coords.top, 
            caretLeft: coords.left + leftModifier,
            hashMode: hashMode,
            themeOptions: themeOptions,
            selectedTheme: selectedTheme,
            content: content
        });
    },
    getInitialState: function() {
        return { 
            content: "", 
            allThemes: [],
            themeOptions: [],
            hashMode: false,
            selectedTheme: 0,
            textareaStyle: {},
            selectionEnd: 0
        };
    },
    componentDidMount: function() {
        this.loadTagsFromServer();
    },
    render: function() {
        var tagBoxStyle = { 
            left: this.state.caretLeft,
            top: this.state.caretTop,
            display: this.state.hashMode && 
                this.state.themeOptions.length > 0 ? 'block' : 'none'
        };
        
        var themes = this.state.themeOptions.map(function(theme, i) {
            var selected = this.state.selectedTheme === i;
            return (
                <div className={ selected ? 'theme selected' : 'theme'} key={i}>{theme.content}</div>  
            );
        }.bind(this));
                
        return (
            <div className="thought-box-wrapper">
                <textarea 
                    className="thought-textarea" 
                    style={this.state.textareaStyle}
                    placeholder="Solid #workout, 8 rep 185 bench, 8 rep 205 bench, 7 rep 225 bench"
                    value={this.state.content}
                    selectionEnd={this.state.selectionEnd}
                    onChange={this.handleChange}
                    onKeyUp={this.handleKeyUp}
                    onKeyDown={this.handleKeyDown}></textarea>
                    
                <div className="help-text">Shift + Enter to submit</div>
                
                <div className="theme-box" style={tagBoxStyle}>
                    {themes}
                </div>
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
    setRecentThoughts: function(recentThoughts) {
        this.setState({ thoughts: recentThoughts });
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
            var thoughtDateCreated = moment(thought.datecreated).format('h:mmA - M/D/YY'),
                content = decodeURI(thought.content);
            return (
                <Thought id={thought.thoughtid} key={thought.thoughtid} datetime={thoughtDateCreated} >
                    {content}
                </Thought>
            );
        });
        
        return (
            <div className="thought-log">
                <ThoughtBox onThoughtSubmitted={this.setRecentThoughts}></ThoughtBox>
                
                <div className="consuming-section">
                    <RecentThoughts thoughts={thoughtNodes}></RecentThoughts>
                    <Explore></Explore>
                </div>
            </div>
        );
    }
});

ReactDOM.render(
  <ThoughtLog />,
  $('#thought-log-wrapper')[0]
);