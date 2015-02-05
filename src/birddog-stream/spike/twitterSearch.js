var TwitterSearchApi = require('../lib/TwitterSearchApi'),
    OAuth = require('../lib/OAuth');

var oauth = new OAuth({
        "consumer_key": "8lcSBjJevMiqsYqgD0jsg",
        "consumer_secret": "ml5XQD4Pzz6qqAyevr5oPi2u2V0IpTwchag7itRAgY",
        "access_token": "108294520-exkPOMkpsSCenbvoHXOYQEoypuVlm67vaySPEpY2",
        "access_token_secret": "asucIquJgVerfs4y3352Ll7RKGrtwc2iRJP5AWzmrxtOG"
    }),
    twitterSearchApi = new TwitterSearchApi(oauth);

twitterSearchApi.lookupUserIdsByScreenNames('twitterApi,twitter', function(userIds) {
    console.log('user ids: ' + userIds);
});