/**
 * Module Dependencies.
 *
 */
var http = require('http'),
    url = require('url');

/**
 * ApiProxy.
 *
 * @param apiContract
 * @param handlers
 * @constructor
 */
function ApiProxy(apiContract, handlers) {
    this.handlers = handlers;
    this.handle = function(req, res) {
        addRequestPropertiesFromUrl(req);
        var pathname = getNormalizedPathname(req.pathname);
        var method = req.method.toUpperCase();
        if(!apiContract[pathname] || apiContract[pathname]['methods'].indexOf(method) === -1) {
            notFound(req, res);
            return;
        }
        var targetServerName = req.headers['x-birddog-stream'];
        var targetServer = findServer(handlers, targetServerName);
        proxyRequest(targetServer, req, res);
    }
}

function findServer(handlers, handlerName) {
    for(var i = 0; i < handlers.length; i++) {
        if(handlers[i].name == handlerName) {
            return handlers[i].server;
        }
    }
    return null;
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

function proxyRequest(targetServer, req, res) {
    var parsedUrl = url.parse(req.url);
    var options = {
        port: targetServer.port,
        hostname: targetServer.host,
        path: parsedUrl.path,
        method: req.method,
        headers: req.headers,
        agent: false
    };

    delete options.headers.host;

    var internalReq = http.request(options, function(internalRes) {
        res.writeHead(internalRes.statusCode, internalRes.headers);
        internalRes.pipe(res);
    });
    req.pipe(internalReq);
}

module.exports = ApiProxy;