var url = require('url'),

    yahooAttributeDictionary = require('./lib/yahooAttributeDictionary');

/**
 *
 * @param postHandler
 * @param settingsStorage
 * @constructor
 */
function Api(postHandler, settingsStorage) {
    this.status = {
        GET: function(req, res) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ server: 'running', stream: postHandler.getStreamStatus() }));
        }
    };

    this.handle = function(req, res) {
        addRequestPropertiesFromUrl(req);
        var pathname = getNormalizedPathname(req.pathname);
        var method = req.method.toUpperCase();
        if(!this[pathname] || !this[pathname][method]) {
            notFound(req, res);
            return;
        }
        var handler = this[pathname][req.method.toUpperCase()];
        handler(req, res);
    };

    // general

    this.module = {
        GET: createConfigPipe(settingsStorage.getModuleStream)
    };

    this.start = {
        GET: function(req, res) {
            postHandler.start(createSimpleResponse(req, res));
        },
        POST: function(req, res) {
            postHandler.start(createSimpleResponse(req, res));
        }
    };

    this.stop = {
        GET: function(req, res) {
            postHandler.stop(createSimpleResponse(req, res));
        },
        POST: function(req, res) {
            postHandler.stop(createSimpleResponse(req, res));
        }
    };

    // twitter config

    this.filters = {
        GET: createConfigPipe(settingsStorage.getFilterStream.bind(settingsStorage))
    };

    this["filters/track"] = {
        POST: createStoreAndRespond(settingsStorage.storeFilters.bind(settingsStorage), function(data, body) { data.track = body; return data; })
    };

    this["filters/follow"] = {
        POST: createStoreAndRespond(settingsStorage.storeFilters.bind(settingsStorage), function(data, body) {data.follow = body; return data; })
    };

    this.mappers = {
        GET: createConfigPipe(settingsStorage.getMapperStream.bind(settingsStorage)),
        POST: createStoreAndRespond(settingsStorage.storeMappers.bind(settingsStorage))
    };

    this["mappers/custom"] = {
        GET: notImplemented,
        POST: notImplemented
    };

    this.schedules = {
        GET: createConfigPipe(settingsStorage.getScheduleStream.bind(settingsStorage)),
        POST: createStoreAndRespond(settingsStorage.storeSchedules.bind(settingsStorage))
    };

    this['schedules/refresh'] = {
        GET: function(req, res) {
            postHandler.refreshScheduler(createSimpleResponse(req, res));
        },
        POST: function(req, res) {
            postHandler.refreshScheduler(createSimpleResponse(req, res));
        }
    }

    // yahoo finance config

    this.polling = {
        GET: createConfigPipe(settingsStorage.getPollingStream.bind(settingsStorage)),
        POST: createStoreAndRespond(settingsStorage.storePolling.bind(settingsStorage))
    };

    this.symbols = {
        GET: createConfigPipe(settingsStorage.getSymbolStream.bind(settingsStorage)),
        POST: createStoreAndRespond(settingsStorage.storeSymbols.bind(settingsStorage))
    };

    this.attributes = {
        GET: function(req, res) {
            var responseObject = {};

            responseObject.attributeNameList = yahooAttributeDictionary.getAttributeNameList();
            settingsStorage.getAttributeSettings(function(err, settings) {
                responseObject.attributeSettings = settings;
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.write(JSON.stringify(responseObject));
                res.end();
            });
        },
        POST: createStoreAndRespond(settingsStorage.storeAttributes.bind(settingsStorage))
    };
}

function addRequestPropertiesFromUrl(req) {
    var parsedUrl = url.parse(req.url, true);
    req.qs = parsedUrl.query;
    req.pathname = parsedUrl.pathname;
}

function getNormalizedPathname(pathname) {
    var pathname = pathname.toLowerCase();
    if(pathname[pathname.length-1] == '/') {
        pathname = pathname.substr(pathname.length -1);
    }
    if(pathname[0] == '/') {
        pathname = pathname.substr(1);
    }
    return pathname;
}

function notFound(req, res) {
    //TODO: log not found.
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
}

function ok(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end();
}

function error(err, req, res) {
    //TODO: log error.
    console.log('api request error: ' + err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
}

function notImplemented() {
    res.writeHead(501, { 'Content-Type': 'text/plain' });
    res.end('Not Implemented');
}

function createConfigPipe(readableFactory) {
    return function(req, res) {
        var readable = readableFactory();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        readable.pipe(res);
        readable.on('error', function(err) {
            error(err, req, res);
        })
        readable.on('end', function() {
            res.end();
        });
    }
}

function createStoreAndRespond(store, transform) {
    return function(req, res) {
        readBody(req, res, function(err, body) {
            if(err)error(err, req, res);
            else
                store(transform ? function(data) { return transform(data, body); } : body, createSimpleResponse(req, res));
        });
    };
}

function createSimpleResponse(req, res) {
    return function(err) {
        if(err) error(err, req, res);
        else ok(req, res);
    };
}

function readBody(req, res, callback) {
    var body = '';
    req.on('data', function(data) {
        body += data;
    });
    req.on('error', function(err) {
        error(err, req, res);
    });
    req.on('end', function() {
        callback(null, JSON.parse(body));
    });
}

module.exports = Api;