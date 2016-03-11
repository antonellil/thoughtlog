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
        <div className="wrapper-header">
            <h3 className="section-header">Recent ({props.thoughts.length})</h3> <span className="scroll-info">(scroll)</span>
        </div>
        <div className="thought-list">
            {props.thoughts}
        </div>
    </div>;

var Similar = (props) =>
    <div className="explore-wrapper">
        <div className="wrapper-header">
            <h3 className="section-header">Selected</h3> <span className="scroll-info">(scroll)</span>
        </div>
        
        <div className="selected-thought-wrapper">
            <div className="explore-help thought" style={{display: props.selectedThoughts.length ? 'none' : 'block'}}>
                Click on a thought to explore similar thoughts
            </div>
            {props.selectedThoughts}
        </div>
        
        <div className="explore-header">
            <h3 className="section-header">Similar {props.thoughts.length ? '(' + props.thoughts.length + ')' : ''}</h3> <span className="scroll-info">(scroll)</span>
        </div>
        
        <div className="thought-list">
            <div className="explore-help thought" style={{display: props.thoughts.length ? 'none' : 'block'}}>
                No similar thoughts
            </div>
            {props.thoughts}
        </div>
    </div>;
    
var Explore = React.createClass({
    getInitialState: function() {
        return { value: '' };  
    },
    handleChange: function(e){
        this.props.setSearch(
            e.target.value,
            e.target.value.replace(/[^A-Za-z0-9\s]/g,'').trim().toLowerCase().split(/\s+/)
        );
    },
    handleKeyUp: function(e) {
        if(e.keyCode === 13 && this.props.searchValue !== '') { // Use enter TODO: get autocomplete working by sharing from thought entry
            this.props.search();
        }
    },
    render: function() {
        return (
            <div className='search-wrapper'>
                <h3 className='section-header'>Explore</h3>
                <div className='search-tools'>
                    <input 
                        type='text' 
                        className='explore-input' 
                        placeholder='workout pushups'
                        value={this.props.searchValue}
                        onChange={this.handleChange}
                        onKeyUp={this.handleKeyUp} />
                </div>
                <h3 className='section-header'>Results {this.props.thoughts.length ? '(' + this.props.thoughts.length + ')' : ''}</h3>
                <div className='thought-list'>
                    {this.props.thoughts}
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
        
        if(content.trim() === '') {
            return; // TODO: error message
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
        // Tabbing is for submit
        if(e.keyCode === 9) {
            e.preventDefault();
        }
        
        // Prevent default in hash mode for enter, down, up
        if(this.state.hashMode) {
            if(e.keyCode === 13 || e.keyCode === 40 || e.keyCode === 38) {
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
            themeOptions = [],
            hashMode = lastTheme
                ? lastTheme.indexOf('#') > -1 && e.keyCode !== 27 // Escape
                : false,
            content = e.target.value,
            selectedTheme = hashMode ? this.state.selectedTheme : 0;
        
        // Enter to submit thought when not in hash mode
        if(e.keyCode === 9 && !hashMode) {
            this.submitThought();
        }
        
        // Handle hash mode
        if(hashMode) {
            themeOptions = _.filter(this.state.allThemes, function(theme) {
                return lastTheme 
                    ? theme.content.toLowerCase().indexOf(lastWord.toLowerCase()) === 0 // Starts with the typed word
                        && theme.content.length !== lastWord.length // If user typed full word, remove
                    : false;
            }).slice(0,10);
            
            // Enter key to selected theme
            if(e.keyCode === 13 && themeOptions.length) {
                content = e.target.value.slice(0, lastResult.index + 1)
                    + themeOptions[selectedTheme].content 
                    + " " // Space after theme entered
                    + e.target.value.slice(lastResult.index + 1 + lastWord.length);
                hashMode = false;
            } else if(themeOptions.length) {
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
            textareaStyle: {}
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
                    onChange={this.handleChange}
                    onKeyUp={this.handleKeyUp}
                    onKeyDown={this.handleKeyDown}></textarea>
                    
                <a className="submit-button" onClick={this.submitThought}>Submit</a>
                
                <div className="theme-box" style={tagBoxStyle}>
                    {themes}
                </div>
            </div>
        );
    }
});

var ThoughtLog = React.createClass({
    getInitialState: function() {
        return { 
            recentThoughts: [], 
            similarThoughts: [], 
            style: { display: 'none' }, 
            exploreThoughts: [],
            searchThoughts: [],
            searchTerms: [],
            searchValue: ""
        };
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
                $('.recent-thoughts-wrapper .thought-list').hide().fadeIn();
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(status, err.toString());
            }
        });
    },
    exploreThought: function(thought) {
        if(thought === undefined || thought === null) {
            thought = this.state.exploreThoughts.slice(-1).pop()
        } else {
            this.setState({ 
                exploreThoughts: this.state.exploreThoughts.concat([thought])
            });
        }
        
        if(thought) {
            ca$h.post({
                url: '/api/thought/explore', 
                data: { thoughtid: thought.thoughtid },
                success: function(data) {
                    this.setState({ similarThoughts: data });
                    $('.explore-wrapper .thought-list').hide().fadeIn();
                }.bind(this),
                error: function(xhr, status, err) {
                    console.error(status, err.toString());
                }
            });
        } else {
            this.setState({ similarThoughts: [] });
        }
    },
    setSearch: function(value, searchTerms) {
        this.setState({ searchValue: value, searchTerms: searchTerms });
    },
    search: function(searchTerm) {
        if(searchTerm) {
            this.setState({ searchTerms: [searchTerm], searchValue: searchTerm });
        }
        
        ca$h.post({
            url: '/api/search',
            data: { searchTerms: searchTerm ? [searchTerm] : this.state.searchTerms },
            success: function(data) {
                this.setState({ searchThoughts: data });
                $('.search-wrapper .thought-list').hide().fadeIn();
            }.bind(this),
            error: function(err) {
                this.setState({ searchThoughts: [] }); // Reset search with nothing
                alert("Error searching. Please try again.");
            }.bind(this)
        });
    },
    deleteThought: function(thoughtid, e) {
        e.stopPropagation();
        
        ca$h.post({
            url: '/api/thought/delete', 
            data: { thoughtid: thoughtid },
            success: function(data) {
                // Delete thought from explore and similar thoughts history
                this.setState({ 
                    exploreThoughts: _.filter(this.state.exploreThoughts, thought => thought.thoughtid !== thoughtid),
                    searchThoughts: _.filter(this.state.searchThoughts, thought => thought.thoughtid !== thoughtid),
                    recentThoughts: _.filter(this.state.recentThoughts, thought => thought.thoughtid !== thoughtid)
                });
                
                this.exploreThought();
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(status, err.toString());
            }
        });
    },
    render: function() {
        // Thought node helper function
        var generateThoughtNodes = function(thoughts) {  
            if(thoughts === undefined || thoughts === null || thoughts[0] === undefined) {
                return [];
            }
            
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
                        onClick={function(theme, e) {
                            e.stopPropagation();
                            this.search(theme.replace('#', ''));
                        }.bind(this, themes[i])} 
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
                        exploreThought={this.exploreThought.bind(this, thought)} />
                );
            }.bind(this));
        }.bind(this);
        
        // Create thought nodes
        var recentThoughtNodes = generateThoughtNodes(this.state.recentThoughts);
        var exploreThoughtNodes = generateThoughtNodes(this.state.similarThoughts);
        var selectedThoughtNodes = generateThoughtNodes(this.state.exploreThoughts.slice(-1));
        var searchThoughtNodes = generateThoughtNodes(this.state.searchThoughts);
        
        return (
            <div className="thought-log" style={this.state.style}>
                <Settings />
            
                <ThoughtBox onThoughtSubmitted={this.setRecentThoughts} />
                
                <div className="consuming-section">
                    <Explore
                        setSearch={this.setSearch}
                        searchValue={this.state.searchValue}
                        search={this.search}
                        thoughts={searchThoughtNodes} />
                    <Similar 
                        selectedThoughts={selectedThoughtNodes} 
                        thoughts={exploreThoughtNodes} />
                    <RecentThoughts 
                        thoughts={recentThoughtNodes} />
                </div>
            </div>
        );
    }
});

ReactDOM.render(
  <ThoughtLog />,
  $('#thought-log-wrapper')[0]
);