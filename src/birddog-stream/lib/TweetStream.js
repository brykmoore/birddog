/**
 * Module dependencies.
 */

var https = require('https'),
    events = require('events'),
    util = require('util'),

    OAuth = require('./OAuth'),
    TwitterSearchApi = require('./TwitterSearchApi');

var streamApi = {
    port: 443,
    hostname: 'stream.twitter.com',
    path: '/1.1/statuses/filter.json',
    method: 'GET'
};

var checkConnectionInterval = 90000,
    streamApiBaseUrl = 'https://' + streamApi.hostname + streamApi.path,
    fixedParameters = { language: 'en' };

/**
 * Tweet Stream.
 *
 * @param options
 * @constructor
 */
function TweetStream(options) {
    this.oauth = new OAuth(options["oauth"]);
    this.buffer = '';
    this.status = 'Not Started';
    this.lastPostTime = null;

    this.searchApi = new TwitterSearchApi(this.oauth);

    this.checkConnectionIntervalId = -1;
}

util.inherits(TweetStream, events.EventEmitter);

/**
 * Start listening for posts.
 *
 */
TweetStream.prototype.start = function(settings) {
    var postStream = this;
    var filters = postStream.filters = settings.filters;
    var trackFilters = filters.track || [];
    postStream.filterRegExps = [];

    for(var i = 0; i < trackFilters.length; i++) {
        postStream.filterRegExps.push((trackFilters[i].text ? trackFilters[i].text : trackFilters[i]).split(/\s+/).map(function(item) {
            for(var j = 0; j < regexSpecialCharacters.length; j++) {
                item = item.replace(regexSpecialCharacters[j], '\\', '\\' + regexSpecialCharacters[j]);
            }
            return new RegExp('\\b' + item + '\\b', 'i');
        }))
    }

    postStream.status = 'Started';
    postStream.emit('start');

    var connectionTimer = createConnectionTimer(postStream);

    beginPrepareRequest(postStream, filters, function(requestOptions) {
        postStream.req = https.request(requestOptions, createPostStreamHandler(postStream, requestOptions));

        postStream.req.on('error', function(e) {
            postStream.emit('requestError', e);
        });

        postStream.req.end();

        postStream.lastPostTime = new Date().getTime();
        postStream.checkConnectionIntervalId = setInterval(connectionTimer, checkConnectionInterval);
    });
};

/**
 * Stop listening for posts.
 */
TweetStream.prototype.stop = function() {
    clearInterval(this.checkConnectionIntervalId);
    if(this.req) {
        this.req.abort();
    }
    this.status = 'Stopped';
    this.emit('stop', {});
    this.lastPostTime = null;
};

var regexSpecialCharacters = ['^','$', '.', '|', '?', '*', '+', '(', ')', '[', '{'];

function extend(target, source) {
    for(var p in source) {
        target[p] = source[p];
    }
}

function makeParameterString(data) {
    var str = '';
    for(var p in data) {
        var kvp = p + '=' + encodeURIComponent(data[p]);
        str = str ? str + '&' + kvp : (str + kvp);
    }
    return str;
}

function beginPrepareRequest(postStream, filters, callback) {
    var requestData = {};

    if(filters["track"] && filters['track'].length) {
        var track = filters["track"].map(function(item) {
                return item.text ? item.text : item;
            }).
            join(',');

        if(track) {
            requestData["track"] = track;
        }
    }

    if(filters['follow'] && filters['follow'].length) {
        var screenNames = filters['follow'];
        postStream.searchApi.lookupUserIdsByScreenNames(screenNames, function(userIds) {
            var followIdString = userIds.join(',');
            console.log('follow ids: ' + followIdString);
            if(followIdString) {
                requestData['follow'] = followIdString;
            }
            var requestOptions = finishPrepareRequest(postStream, requestData);
            callback(requestOptions);
        });
    } else {
        var requestOptions = finishPrepareRequest(postStream, requestData);
        callback(requestOptions);
    }
}

function finishPrepareRequest(postStream, requestData) {
    extend(requestData, fixedParameters);

    var authHeader = postStream.oauth.getAuthorization(streamApi.method, streamApiBaseUrl, requestData);

    var requestOptions = {
        headers: {
            'Authorization': authHeader
        }
    };

    extend(requestOptions, streamApi);
    requestOptions.path = streamApi.path + '?' + makeParameterString(requestData);

    return requestOptions;
}

function createConnectionTimer(postStream) {
    return function() {
        var nowTime = new Date().getTime();
        if(nowTime - postStream.lastPostTime > checkConnectionInterval) {
            postStream.emit('connectionStale', {});
        }
    }
}

function createPostStreamHandler(postStream, requestOptions) {
    return function(res) {

        postStream.emit('responseStarted', {
            statusCode: res.statusCode,
            headers: res.headers
        });

        res.setEncoding('utf8');

        if(res.statusCode > 200) {

            var connectError = {
                statusCode: res.statusCode,
                headers: res.headers,
                requestOptions: requestOptions
            };

            var errorMessage = '';

            res.on('data', function(data) {
                errorMessage += data;
            });

            res.on('end', function() {
                connectError.body = errorMessage;
                postStream.emit('connectError', connectError);
            });

            return;
        }

        if(res.statusCode == 200) {
            postStream.emit('connectSuccess', {});
        }

        postStream.buffer = '';

        res.on('data', function(data){
            postStream.lastPostTime = new Date().getTime();
            postStream.buffer += data;
			var eot = "\r\n";
			var eotIndex = postStream.buffer.indexOf(eot);
			var FoundTweet = eotIndex > 0;
            var error = null;

			if (FoundTweet) {
				var tweet = postStream.buffer.slice(0, eotIndex);
				postStream.buffer = postStream.buffer.slice(eotIndex + 1);
                try {
                    var post = JSON.parse(tweet);
                } catch(err) {
                    error = {
                        buffer: postStream.buffer,
                        err: err.toString()
                    };
                } finally {
                    postStream.buffer = '';
                }

                if(post != null) {
                    if(post["warning"]) {
                        postStream.emit('stallWarning', post);
                    } else {
                        explainMatch(postStream, post);
                        // skipping if the match isn't really a match.
                        if(post.matchExplanations.length > 0) {
                            postStream.emit('post', post);
                        }
                    }
                } else if(error != null) {
                    postStream.emit('parseError', error);
                }
            }
            // if(eot > 0) {
                // var post = null,
                    // error = null;

                // try {
                    // var post = JSON.parse(postStream.buffer);
                // } catch(err) {
                    // error = {
                        // buffer: postStream.buffer,
                        // err: err.toString()
                    // };
                // } finally {
                    // postStream.buffer = '';
                // }

                // if(post != null) {
                    // if(post["warning"]) {
                        // postStream.emit('stallWarning', post);
                    // } else {
                        // explainMatch(postStream, post);
                        // // skipping if the match isn't really a match.
                        // if(post.matchExplanations.length > 0) {
                            // postStream.emit('post', post);
                        // }
                    // }
                // } else if(error != null) {
                    // postStream.emit('parseError', error);
                // }
            // }
        });
    };
}

function explainMatch(postStream, post) {
    var trackFilters = postStream.filters.track,
        text = post.text,
        i, j
        ;

    var matchExplanations = [];

    if(text && trackFilters && trackFilters.length) {
        var trackFilterLength = trackFilters.length;
        for(i = 0; i < trackFilterLength; i++) {
            var trackFilter = trackFilters[i],
                trackFilterPartRegExps = postStream.filterRegExps[i],
                trackFilterPartsLength = trackFilterPartRegExps.length;
            var textPartMatchCount = 0;
            for(j = 0; j < trackFilterPartsLength; j++) {
                var trackFilterPartRegExp = trackFilterPartRegExps[j];
                var matches = text.match(trackFilterPartRegExp);
                if(matches && matches.length) {
                    textPartMatchCount++;
                }
            }
            if(textPartMatchCount == trackFilterPartsLength) {
                matchExplanations.push(trackFilter);
            }
        }
    }

    post.matchExplanations = matchExplanations;
}

/**
 * Export ctor.
 */
module.exports = TweetStream;