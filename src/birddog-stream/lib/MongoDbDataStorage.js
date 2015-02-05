/**
 *
 * Module dependencies.
 */

var MongoClient = require('mongodb').MongoClient;

/**
 * MongoDbDataStorage.
 *
 * @param options
 * @constructor
 */
function MongoDbDataStorage(options) {
    this.options = options;
}

/**
 *
 * @param callback
 */
MongoDbDataStorage.prototype.init = function(callback) {
    MongoClient.connect(this.options.uri, function(err, db) {

        this.db = db;

        // create indexes

        var that = this;

        var doIndexTask = function() {
            var indexTask = indexTaskList.pop();

            if(indexTask) {
                indexTask();
            } else {
                callback(err, that);
            }
        };

        var indexTaskList = [

            function() {
                db.ensureIndex('posts', {
                    streamHandler: 1,
                    streamHandlerSessionId: 1,
                    streamHandlerReceived: 1
                }, doIndexTask);
            },

            function() {
                db.ensureIndex('posts', {
                    "matchExplanations.key": 1
                }, doIndexTask);
            },

            function() {
                db.ensureIndex('posts', {
                    "matchExplanations.text": 1
                }, doIndexTask);
            },

            function() {
                db.ensureIndex('posts', {
                    "matchExplanations.category": 1
                }, doIndexTask);
            },

            function() {
                db.ensureIndex('posts', {
                    "mood.Category": 1
                }, doIndexTask);
            },

            function() {
                db.ensureIndex('postStreamEvents', {
                    streamHandler: 1,
                    eventName: 1
                }, doIndexTask);
            }
        ];

        doIndexTask();
    }.bind(this));
};

/**
 *
 * @param doc
 * @param callback
 */
MongoDbDataStorage.prototype.storePost = function(doc, callback) {
    storeDoc(this.db, 'posts', doc, callback);
};

MongoDbDataStorage.prototype.storePostHandlerEvent = function(doc, callback) {
    storeDoc(this.db, 'postStreamEvents', doc, callback);
};

function storeDoc(db, collection, doc, callback) {
    db.collection(collection).insert(doc, {w:1}, function(err, objects) {
        if (err) callback && callback(err);
        else callback && callback(null, objects);
    });
}

module.exports = MongoDbDataStorage;