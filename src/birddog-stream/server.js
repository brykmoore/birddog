var http = require('http');

var handlerConfig = require('./config/handlers.json'),
    storageConfig = require('./config/storage.json')
    ;

var PostStorage = require(storageConfig.module),
    SettingsStorage = require('./lib/FileSystemSettingsStorage'),
    PostMapper = require('./lib/PostMapper'),
    Scheduler = require('./lib/scheduling').Scheduler

    Api = require('./Api'),
    PostHandler = require('./lib/PostHandler')
;

var servers = [];

function initApp() {
    handlerConfig.forEach(function(handler) {
        var PostStream = require('./lib/' + handler.module),
            settingsStorage = new SettingsStorage(handler.settingsConfig),
            scheduler = new Scheduler(),
            postStream = new PostStream(handler.streamConfig),
            postMapper = new PostMapper(),
            postHandler = new PostHandler(handler.name, scheduler, postStream, postStorage, settingsStorage, postMapper),
            api = new Api(postHandler, settingsStorage)
            ;

        var server = http.createServer(api.handle.bind(api));

        server.listen(handler.server.port, handler.server.host);

        servers.push(server);

        console.log(handler.name + ' listening on ' + handler.server.host + ':' + handler.server.port);

        postHandler.init();
    });
}

var postStorage = new PostStorage(storageConfig.options);

function initStorage(callback) {
    postStorage.init(function(err) {
        if(err) console.warn(err);
        else callback();
    });
}

initStorage(initApp);
