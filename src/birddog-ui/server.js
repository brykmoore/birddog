/**
 *
 * Module Dependencies.
 */
var connect = require('connect');

var serverConfig = require('./config/server.json'),
    handlers = require('./config/handlers.json'),
    ApiProxy = require('./lib/ApiProxy'),
    StreamHandlerApi = require('./lib/StreamHandlerApi'),
    DataViews = require('./lib/MongoDbDataViews')

    apiContract = require('./lib/apiContract'),
    apiProxy = new ApiProxy(apiContract, handlers),
    dataViews = new DataViews(require('./config/storage.json').options),
    streamHandlerApi = new StreamHandlerApi(handlers, dataViews)
;

function initViews(callback) {
    dataViews.init(function(err) {
        if(err) console.warn(err);
        else callback();
    });
}

function initApp() {
    connect()
        .use('/streamHandlers', streamHandlerApi.handle.bind(streamHandlerApi))
        .use('/api', apiProxy.handle.bind(apiProxy))
        .use(connect.static(__dirname + '/app'))
        .listen(serverConfig.port);
    ;

    console.log(serverConfig.host + ' listening on ' + serverConfig.port + '...');
}

initViews(initApp);