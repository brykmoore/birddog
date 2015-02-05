var MongoClient = require('mongodb').MongoClient;

/**
 * MongoDbDataStorage.
 *
 * @param options
 * @constructor
 */
function MongoDbDataViews(options) {
    this.options = options;
}

/**
 *
 * @param callback
 */
MongoDbDataViews.prototype.init = function(callback) {
    MongoClient.connect(this.options.uri, function(err, db) {
        this.db = db;
        callback(err, this);
    }.bind(this));
};

/**
 *
 * @param doc
 * @param callback
 */
MongoDbDataViews.prototype.getPostsTableByStreamHandler = function(streamHandler, columns, skip, limit, callback) {
    var data = {
        headers: columns,
        records: []
    }, i,j;

    this.db.collection('posts')
        .find({streamHandler: streamHandler})
        .skip(skip)
        .limit(limit)
        .sort( { $natural: -1 } )
        .toArray(function(err, arr) {
            if(err) throw err;
//            for(i = 0; i < arr.length; i++) {
//                var record = {};
//                for(j = 0; j < columns.length; j++) {
//                    record[columns[j]] = arr[i][columns[j]];
//                }
//                data.records.push(record);
//            }
            for(i = 0; i < arr.length; i++) {
                var record = [];
                for(j = 0; j < columns.length; j++) {
                    record.push(arr[i][columns[j]]);
                }
                data.records.push(record);
            }

            callback && callback(null, data);
        });
};

/**
 *
 * @param doc
 * @param callback
 */
MongoDbDataViews.prototype.getRecentPostsByStreamHandler = function(streamHandler, limit, callback) {
    this.db.collection('posts')
        .find({streamHandler: streamHandler})
        .limit(limit)
        .sort( { $natural: -1 } )
        .toArray(callback);
};

MongoDbDataViews.prototype.getStreamHandlerSessions = function(streamHandler, callback) {
    this.db.collection('posts').aggregate([
        {
            $match: {
                streamHandler: streamHandler
            }
        },
        {
            $group: {
                _id: {
                    sessionId: "$streamHandlerSessionId"
                },
                numberOfPosts: {
                    $sum: 1
                },
                firstPostTime: {
                    $min: "$streamHandlerReceived"
                },
                mostRecentPostTime: {
                    $max: "$streamHandlerReceived"
                }
            }
        },
        {
            $project: {
                _id: 1,
                numberOfPosts: 1,
                firstPostTime: 1,
                mostRecentPostTime: 1,
                timeSpan: { $divide: [{$subtract: ["$mostRecentPostTime", "$firstPostTime"]}, 1000] }
            }
        },
        {
            $project: {
                _id: 1,
                numberOfPosts: 1,
                firstPostTime: 1,
                mostRecentPostTime: 1,
                timeSpan: 1,
                rate: {
                    $cond: [ {"$eq": ["$timeSpan", 0]}, 0, {$divide: ["$numberOfPosts", "$timeSpan"]}]
                }
            }
        }, {$sort: { mostRecentPostTime: -1 }}]
    , callback);
};

MongoDbDataViews.prototype.getStreamHandlerErrorsAndWarnings = function(streamHandler, callback) {
    this.db.collection('postStreamEvents')
        .find({
            "streamHandler": streamHandler,
            "eventName": {
                $in: ['CONNECT_ERROR', 'PARSE_ERROR', 'RESPONSE_ERROR', 'STALL_WARNING', 'BACKOFF_EXCEEDED', 'CONNECTION_STALE']
            }
        })
        .limit(100)
        .sort( { $natural: -1 } )
    .toArray(callback);
};

/**
 *
 * @type {Function}
 */
module.exports = MongoDbDataViews;