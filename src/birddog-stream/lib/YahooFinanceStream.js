/**
 *
 * Module dependencies
 */

var http = require('http'),
    events = require('events'),
    util = require('util'),

    yahooAttributeDictionary = require('./YahooAttributeDictionary');

var financeEndpoint = {
    hostname: 'download.finance.yahoo.com',
    path: '/d/quotes.csv',
    port: 80,
    method: 'GET'
};

/**
 * YahooFinanceStream.
 *
 * Implements a streaming API over a polling loop that runs against the Yahoo finance endpoint.
 *
 * @param options
 * @constructor
 */
function YahooFinanceStream() {
    this.status = 'Not Started';
    this.timeoutId = null;
}

util.inherits(YahooFinanceStream, events.EventEmitter);

/**
 * Start listening for posts.
 */
YahooFinanceStream.prototype.start = function(settings) {
    this.pollInterval = settings.polling.interval;
    this.symbols = settings.symbols;
    this.attributes = settings.attributes;

    this.status = 'Started';
    
    this.emit('start');

    fetchData(this);
};

/**
 * Stop listening for posts.
 */
YahooFinanceStream.prototype.stop = function() {
    this.status = 'Stopped';
    if(this.timeoutId != null) {
        clearTimeout(this.timeoutId);
    }
    this.timeoutId = null;
    this.emit('stop');
};

function clone(obj) {
    var clone = {};
    for(var p in obj) {
        clone[p] = obj[p];
    }
    return clone;
}

function createQueryString(symbols, attributes) {
    return '?s=' + symbols.join('+') + '&f=' + attributes.map(function(item){ return yahooAttributeDictionary.getQueryParam(item); }).join('');
}

var stringCleanRegex = /^(")(.*)(")$/;

function createPosts(responseBody, attributes) {
    var lines = responseBody.split('\r\n');
    var posts = [];
    for(var i = 0; i < lines.length; i++) {
        var row = lines[i];
        if(row == '') continue;
        var parts = row.match(/("[^"]+"|[^,]+)/g);
        if(parts.length == attributes.length) {
            var obj = {};
            for(var j = 0; j < parts.length; j++) {
                var val = parts[j];
                obj[attributes[j]] = val.replace(stringCleanRegex, "$2");
                //obj[attributes[j]] = val;
            }
            posts.push(obj);
        } else {
            throw {
                "message": "attribute length does not match.",
                "line": row
            };
        }
    }

    return posts;
}

function createDataFetcher(postStream) {
    return function() {
        fetchData(postStream);
    };
}

function fetchData(postStream) {
    var symbols = postStream.symbols;
    var formats = postStream.attributes;
    var pollInterval = postStream.pollInterval;

    var options = clone(financeEndpoint);

    options.path = financeEndpoint.path + createQueryString(symbols, formats);

    var req = http.request(options, function(res) {
        var body = '';
        res.setEncoding('utf8');
        res.on('data', function(data) {
            body += data;
        });
        res.on('error', function(err) {            
            postStream.emit('responseError', {
                error: err,
                statusCode: res.statusCode
            });
        });
        res.on('end', function() {
            if(res.statusCode != 200) {
                postStream.emit('connectError', {
                    responseBody: body,
                    statusCode: res.statusCode
                });
            }
            else {
                postStream.emit('connectSuccess', {});

                var posts = null,
                    error = null;

                try {
                    posts = createPosts(body, formats);
                } catch(err) {
                    error = {
                        buffer: body,
                        err: err
                    };
                }

                if(posts != null) {
                    postStream.emit('posts', posts);
                    postStream.timeoutId = setTimeout(createDataFetcher(postStream), pollInterval);
                } else if(error != null) {
                    console.error('parseError');
                    postStream.emit('parseError', {
                        error: error
                    });
                }
            }
        });
    });

    req.on('error', function(err) {
        postStream.emit('requestError', {
            error: err
        });
    });

    req.end();
}

module.exports = YahooFinanceStream;