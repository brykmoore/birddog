var FinanceStream = require('./../lib/YahooFinanceStream'),
    PostStorage = require('./../lib/MongoDbDataStorage');

var financeStream = new FinanceStream({
        symbols: ['AAPL', 'MSFT', 'GOOG', 'SEB'],
        pollInterval: 3000,
//        pollInterval: 60000,
        formats: ["symbol", "name", "lastTradePrice", "lastTradeDate", "lastTradeTime"
            , "lastTradeRealTimeWithTime", "changePercentRealTime", "change", "changeRealTime", "changeInPercent"]
    }),
    postStorage = new PostStorage({
        "uri": "mongodb://127.0.0.1:27017/birddog"
    });

function initStorage(callback) {
    postStorage.init(function(err) {
        if(err) console.warn(err);
        else callback();
    });
}

financeStream.on('posts', function(posts) {
    for(var i = 0; i < posts.length; i++) {
        posts[i].streamHandler = 'Finance Stream 1';
    }
    postStorage.storePost(posts, function(err, doc) {
        if(err) console.warn(err);
        else console.log(doc);
    });
});

financeStream.on('connectError', function(err) {
    console.log(err);
});
financeStream.on('parseError', function(err) {
    console.log(err);
});
financeStream.on('responseError', function(err) {
    console.log(err);
});
financeStream.on('requestError', function(err) {
    console.log(err);
});

initStorage(function() {
    financeStream.start();
});