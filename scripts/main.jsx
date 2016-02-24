var Thought = (props) => 
    <div className="thought" onClick={props.exploreThought}>
        <div className="thought-content">
            {props.content}
        </div>
        <span className="thought-datetime">
            {props.datetime}
        </span>
        <span className="delete-thought" onClick={props.deleteThought}>
            delete
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
                <div className="explore-results">
                    <div className="thought-list">
                        {this.props.thoughts}
                    </div>
                </div>
            </div>
        );
    }
});

var Settings = React.createClass({
    logout: function() {
        ca$h.get({
            url: '/logout', 
            success: function() {
                localStorage.removeItem('authToken');
                localStorage.removeItem('brainid');
                window.location.replace('/login');
            }, 
            error: function() {
                alert("There was an error logging out. Please try again.");
            }
        });
    },
    render: function() {
        return (
            <div className="settings-wrapper">
                <a className="logout-button" onClick={this.logout}>Logout</a>
            </div>
        );
    }
});

var ThoughtBox = React.createClass({
    loadTagsFromServer: function() {
        ca$h.get({
            url: '/api/themes/getAll', 
            success: function(data){
                this.setState({ allThemes: data });
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(status, err.toString());
            }
        });
    },
    submitThought: function(e) {
        var content = this.state.content;
        
        if(content.trim() == '') {
            this.setState({ error: true });
            return;
        }
        
        this.setState({ content: ""}); // Clear content
        
        ca$h.post({
            url: '/api/thoughts/submit',
            data: { content: encodeURI(content.trim()) },
            success: function(data) {
                this.setState({ content: "", hashMode: false, allThemes: data.themes });
                this.props.onThoughtSubmitted(data.recentThoughts);
            }.bind(this),
            error: function(err) {
                this.setState({ content: content }); // Reset content with submitted
                alert("Error submitting post. Please try again.");
            }.bind(this)
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
        return ca$h.mod(selectedTheme, themeOptions.length);
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
                        ? theme.content.toLowerCase().indexOf(lastWord.toLowerCase()) === 0 // Starts with the typed word
                            && theme.content.length !== lastWord.length // If user typed full word, remove
                        : false;
                }).slice(0,10),
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
            caretTop: coords.top + 20, 
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
        return { recentThoughts: [], exploreThoughts: [], style: { display: 'none' } };
    },
    componentDidMount: function() {
        this.loadRecentThoughtsFromServer();
    },
    setRecentThoughts: function(recentThoughts) {
        this.setState({ recentThoughts: recentThoughts });
    },
    loadRecentThoughtsFromServer: function() {
        ca$h.get({
            url: '/api/thoughts/recent', 
            success: function(data) {
                this.setState({ recentThoughts: data, style: { display: 'block' } });
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(status, err.toString());
            }
        });
    },
    exploreThought: function(thoughtid) {
        ca$h.post({
            url: '/api/thought/explore', 
            data: { thoughtid: thoughtid },
            success: function(data) {
                this.setState({ exploreThoughts: data });
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(status, err.toString());
            }
        });
    },
    deleteThought: function(thoughtid, e) {
        e.stopPropagation();
        ca$h.post({
            url: '/api/thought/delete', 
            data: { thoughtid: thoughtid },
            success: function(data) {
                this.loadRecentThoughtsFromServer();
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(status, err.toString());
            }
        });
    },
    render: function() {
        // Thought node helper function
        var generateThoughtNodes = function(thoughts) {  
            return thoughts.map(function(thought, i) {
                var thoughtDateCreated = moment(thought.datecreated).format('h:mmA - M/D/YY'),
                    decodedContent = decodeURI(thought.content),
                    themes = decodedContent.match(/\B#\w\w+/g),
                    contentPieces = decodedContent.split(/\B#\w\w+/g),
                    i = 0, clickableContent = contentPieces ? [contentPieces[i]] : [];
                
                // Generate a clickable thought JSX array
                while(themes && i < themes.length) {
                    clickableContent.push(
                        <a 
                        className="theme-tag" 
                        onClick={function(t){alert(t);}.bind(this, themes[i])} 
                        key={thought.thoughtid + i}>
                            {themes[i]}
                        </a>);
                    clickableContent.push(contentPieces[i + 1]);
                    i++;
                }
                    
                return (
                    <Thought id={thought.thoughtid} 
                        key={thought.thoughtid} 
                        datetime={thoughtDateCreated} 
                        content={clickableContent} 
                        deleteThought={this.deleteThought.bind(this, thought.thoughtid)}
                        exploreThought={this.exploreThought.bind(this, thought.thoughtid)} />
                );
            }.bind(this));
        }.bind(this);
        
        // Create thought nodes
        var recentThoughtNodes = generateThoughtNodes(this.state.recentThoughts);
        var exploreThoughtNodes = generateThoughtNodes(this.state.exploreThoughts);
        
        return (
            <div className="thought-log" style={this.state.style}>
                <Settings />
            
                <ThoughtBox onThoughtSubmitted={this.setRecentThoughts} />
                
                <div className="consuming-section">
                    <RecentThoughts thoughts={recentThoughtNodes} />
                    <Explore thoughts={exploreThoughtNodes} />
                </div>
            </div>
        );
    }
});

ReactDOM.render(
  <ThoughtLog />,
  $('#thought-log-wrapper')[0]
);