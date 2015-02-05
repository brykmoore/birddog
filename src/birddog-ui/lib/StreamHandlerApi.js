/**
 *
 * Module Dependencies.
 */
var http = require('http'),
    url = require('url');

/**
 * StreamHandlerApi.
 *
 * @param streamHandlerNames
 * @param dataViews
 * @constructor
 */
function StreamHandlerApi(handlers, dataViews) {
    this.dataStorage = dataViews;

    this.handlers = handlers;
    this.streamHandlerNames = getStreamHandlerNames(handlers);

    var clientHandlerInfo = handlers.map(function(item) {
        return {
            "name": item.name,
            "settingsConfig": {
                "modules": item.settingsConfig.modules
            }
        };
    });

    this.handle = function(req, res) {
        addRequestPropertiesFromUrl(req);
        var pathname = getNormalizedPathname(req.pathname);
        var targetServerName = req.headers['x-birddog-stream'];

        if(pathname == null || pathname == '') {
            var json = JSON.stringify(clientHandlerInfo);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(json);
        } else if(pathname == 'data') {
            var limit = +(req.qs["limit"] || 20);
            var skip = +(req.qs["skip"] || 0);

            var columns = [];
            for(var i = 0; i < this.handlers.length;i++) {
                if(this.handlers[i].name == targetServerName) {
                    columns = this.handlers[i].viewConfig.dataPoints;
                    break;
                }
            }
            this.dataStorage.getPostsTableByStreamHandler(targetServerName, columns, skip, limit, function(err, docs) {
                if(err) error(err, req, res);
                else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(docs));
                }
            });
        } else if(pathname == 'recent') {
            var take = +(req.qs["take"] || 20);
            this.dataStorage.getRecentPostsByStreamHandler(targetServerName, take, function(err, docs) {
                if(err) error(err, req, res);
                else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(docs));
                }
            });
        } else if(pathname == 'sessions') {
            this.dataStorage.getStreamHandlerSessions(targetServerName, function(err, docs) {
                if(err) error(err, req, res);
                else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(docs));
                }
            });
        } else if(pathname == 'errors') {
            this.dataStorage.getStreamHandlerErrorsAndWarnings(targetServerName, function(err, docs) {
                if(err) error(err, req, res);
                else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(docs));
                }
            });
        }
    };
}

function getStreamHandlerNames(handlers) {
    return handlers.map(function(handler) {
        return handler.name;
    });
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
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
}

function error(err, req, res) {
    console.log(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
}

module.exports = StreamHandlerApi;