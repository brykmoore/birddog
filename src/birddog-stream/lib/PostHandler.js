/**
 * PostHandler.
 *
 * This is the primary driver.
 * Orchestrates the activity between the stream, scheduler, mappers and storage.
 *
 * @constructor
 */
function PostHandler(name, scheduler, postStream, postStorage, settingsStorage, postMapper) {
    this.name = name;
    this.scheduler = scheduler;
    this.postStorage = postStorage;
    this.postStream = postStream;
    this.settingsStorage = settingsStorage;
    this.postMapper = postMapper;

    this.sessionId = null;
    this.running = false;
}

PostHandler.prototype.init = function(callback) {
    var self = this;
    this.settingsStorage.getAllSettings(function(err, settings) {
        if(err) callback && callback(err);
        else {
            self.settings = settings;
            self.scheduler.setSchedules(settings.schedules);

            var starter = function() { self.start();};
            var stopper = function() { self.stop();};

            createEventHandler(self, self.scheduler, 'active', 'postHandlerStarted', starter);
            createEventHandler(self, self.scheduler, 'inactive', 'postHandlerStopped', stopper);
            self.scheduler.start();
            callback && callback();
        }
    });
};

PostHandler.prototype.start = function(callback) {
    var self = this;
    if(self.running) {
        callback && callback();
    } else {
        self.sessionId = guid();
        self.settingsStorage.getAllSettings(function(err, settings) {
            if(err) callback && callback(err)
            else {
                self.settings = settings;
                self.scheduler.setSchedules(settings.schedules);
                self.postMapper.setMappers(settings.mappers && settings.mappers.active);
                self.postStream.on('connectSuccess', resetBackoffLimits);

                var postMappedHandler = createPostMappedHandler(self);
                var postReceivedHandler = createPostReceivedHandler(self, postMappedHandler);

                self.postStream.on('post', postReceivedHandler);
                self.postStream.on('posts', postReceivedHandler);

                var httpBackoffHandler = createBackoffHandler(self, httpBackoff);
                var tcpBackoffHandler = createBackoffHandler(self, tcpBackoff);

                var stop = self.stop.bind(self);

                createEventHandler(self, self.postStream, 'responseStarted', 'RESPONSE_STARTED');
                createEventHandler(self, self.postStream, 'requestError', 'REQUEST_ERROR', httpBackoffHandler);
                createEventHandler(self, self.postStream, 'connectError', 'CONNECT_ERROR', httpBackoffHandler);
                createEventHandler(self, self.postStream, 'error', 'RESPONSE_ERROR', stop);
                createEventHandler(self, self.postStream, 'parseError', 'PARSE_ERROR', stop);
                createEventHandler(self, self.postStream, 'start', 'STREAM_START');
                createEventHandler(self, self.postStream, 'stop', 'STREAM_STOP');
                createEventHandler(self, self.postStream, 'stallWarning', 'STALL_WARNING');
                createEventHandler(self, self.postStream, 'connectionStale', 'CONNECTION_STALE', tcpBackoffHandler);

                self.postStream.start(settings);
                self.running = true;

                callback && callback();
            }
        });
    }
};

PostHandler.prototype.stop = function(callback) {
    this.running = false;
    this.postStream.stop();
    removeListeners(this.postStream);
    callback && typeof(callback) == 'function' && callback();
};

PostHandler.prototype.refreshScheduler = function(callback) {
    var scheduler = this.scheduler;
    this.settingsStorage.getSchedules(function(err, schedules) {
        if(err) callback(err);
        scheduler.setSchedules(schedules);
        scheduler.stop();
        scheduler.start();
        callback();
    });
};

PostHandler.prototype.getStreamStatus = function() {
    return this.postStream.status;
};

var tcpBackoff = {
    current: 0,
    min: 250,
    max: 64000,
    strategy: 'linear'
},
httpBackoff = {
    current: 0,
    min: 5000,
    max: 1280000,
    strategy: 'exponential'
},
http420Backoff = {
    current: 0,
    min: 60000,
    max: 1200000,
    strategy: 'exponential'
}
;

function createPostReceivedHandler(postHandler, postMappedHandler) {
    return function(post) {
        if(Array.isArray(post)) {
            for(var i = 0; i < post.length; i++) {
                var singlePost = post[i];
                postHandler.postMapper.map(singlePost, postMappedHandler);
            }
        } else {
            postHandler.postMapper.map(post, postMappedHandler);
        }
    };
}

function createPostMappedHandler(postHandler) {
    return function(err, post) {
        if(err) console.warn(err);
        else {
            var now = new Date();
            post.streamHandler = postHandler.name;
            post.streamHandlerSessionId = postHandler.sessionId;
            post.streamHandlerReceived = now.getTime();
            post.streamHandlerReceivedDate = now;
            post.streamHandlerReceivedDateInfo = {
                time: now.getTime(),
                date: now,
                utcYear: now.getUTCFullYear(),
                utcMonth: now.getUTCMonth(),
                utcDay: now.getUTCDate(),
                utcHours: now.getUTCHours(),
                utcMinutes: now.getUTCMinutes(),
                utcSeconds: now.getUTCSeconds()
            };
            postHandler.postStorage.storePost(post, postStored.bind(postHandler));
        }
    };
}

function postStored(err) {
    if(err) console.warn(err);
}

function createEventHandler(postHandler, emitter, emitterEvent, handlerEvent, react) {
    emitter.on(emitterEvent, function(eventData) {
        console.log('*** PostHandler *** ' + postHandler.name + ' received event ' + emitterEvent + '.')
        var now = new Date();
        postHandler.postStorage.storePostHandlerEvent({
            streamHandler: postHandler.name,
            eventName: handlerEvent,
            occurred: new Date().getTime(),
            additional: eventData,
            sessionId: postHandler.sessionId,
            date: now,
            dateInfo: {
                time: now.getTime(),
                date: now,
                utcYear: now.getUTCFullYear(),
                utcMonth: now.getUTCMonth(),
                utcDay: now.getUTCDate(),
                utcHours: now.getUTCHours(),
                utcMinutes: now.getUTCMinutes(),
                utcSeconds: now.getUTCSeconds()
            }
        });

        react && react(eventData);
    });
}

function getBackoff(options) {
    if(options.current > options.max) {
        return -1;
    }
    if(options.strategy === 'linear') {
        options.current = options.current + options.min;
        return options.current;
    } else if(options.strategy === 'exponential') {
        if(options.current == 0) {
            options.current = options.min;
        } else {
            options.current = options.current + options.current;
        }
        return options.current;
    } else {
        throw new Error('No strategy specified for backoff options.');
    }
}

function resetBackoffLimits() {
    tcpBackoff.current = 0;
    httpBackoff.current = 0;
    http420Backoff.current = 0;
}

function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

function removeListeners(postStream) {
    postStream.removeAllListeners('responseStarted');
    postStream.removeAllListeners('connectSuccess');
    postStream.removeAllListeners('requestError');
    postStream.removeAllListeners('connectError');
    postStream.removeAllListeners('start');
    postStream.removeAllListeners('stop');
    postStream.removeAllListeners('post');
    postStream.removeAllListeners('posts');
    postStream.removeAllListeners('stallWarning');
    postStream.removeAllListeners('parseError');
    postStream.removeAllListeners('error');
}

function createBackoffHandler(postHandler, backoffMode) {
    return function(eventData) {

        postHandler.postStream.stop();

        var instanceBackoff = backoffMode;

        if(instanceBackoff == httpBackoff && eventData.statusCode == 420) {
            instanceBackoff = http420Backoff;
        }

        var backoffMilliseconds = getBackoff(instanceBackoff);

        if(backoffMilliseconds > 0) {
            console.log('*** PostHandler *** ' + postHandler.name + ' backing off for ' + backoffMilliseconds + ' milliseconds.');
            setTimeout(function() {
                console.log('*** PostHandler *** ' + postHandler.name + ' backoff wait reached. resuming.')
                postHandler.postStream.start(postHandler.settings);
            }, backoffMilliseconds);
        } else {
            console.log('*** PostHandler *** ' + postHandler.name + ' backoff exceeded. will not try again.');
            postHandler.postStorage.storePostHandlerEvent({
                streamHandler: postHandler.name,
                eventName: 'BACKOFF_EXCEEDED',
                occurred: new Date().getTime(),
                additional: eventData,
                sessionId: postHandler.sessionId,
                date: now,
                dateInfo: {
                    time: now.getTime(),
                    date: now,
                    utcYear: now.getUTCFullYear(),
                    utcMonth: now.getUTCMonth(),
                    utcDay: now.getUTCDate(),
                    utcHours: now.getUTCHours(),
                    utcMinutes: now.getUTCMinutes(),
                    utcSeconds: now.getUTCSeconds()
                }                
            });
            //removeListeners(postHandler.postStream);
            postHandler.stop();
        }
    };
}

module.exports = PostHandler;