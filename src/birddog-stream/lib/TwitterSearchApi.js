/**
 *
 * Module Dependencies.
 */

var https = require('https');

var searchApi = {
        port: 443,
        hostname: 'api.twitter.com',
        path: '/1.1/users/lookup.json',
        method: 'GET'
    },
    searchApiBaseUrl = 'https://' + searchApi.hostname + searchApi.path;

/**
 * TwitterSearchApi.
 *
 * @param oauth
 * @constructor
 */
function TwitterSearchApi(oauth) {
    this.oauth = oauth;
}

/**
 * Lookup user ids by screen names.
 *
 * @param screenNames
 * @param callback
 */
TwitterSearchApi.prototype.lookupUserIdsByScreenNames = function(screenNames, callback) {
    var requestData = {
        "screen_name": screenNames.join(',')
    };

    if(!requestData["screen_name"]) {
        callback([]);
    }

    var authHeader = this.oauth.getAuthorization(searchApi.method, searchApiBaseUrl, requestData);

    var requestOptions = {
        headers: {
            'Authorization': authHeader
        }
    };

    extend(requestOptions, searchApi);
    requestOptions.path = searchApiBaseUrl + '?' + makeParameterString(requestData);

    console.log('Request Options:');
    console.log(requestOptions);

    var req = https.request(requestOptions, function(res) {
        var body = '';
        console.log(req._header);
        console.log(res.statusCode);

        res.on('data', function(data) {
            body += data;
        });

        res.on('error', function(err) {
            console.log(err);
            throw err;
        });

        res.on('end', function() {
            console.log('res end');
            console.log(body);

            var result = JSON.parse(body);

            if(result['errors']) {
                console.log(result);
                callback([]);
            } else {
                var userIds = result.map(function(item) {
                    return item.id_str;
                });

                callback(userIds);
            }
        });
    });

    req.on('error', function(err) {
        console.log(err);
        throw err;
    });

    req.end();
};

function extend(target, source) {
    for(var p in source) {
        target[p] = source[p];
    }
}

function makeParameterString(data) {
    var str = '';
    for(var p in data) {
        var kvp = p + '=' + encodeURIComponent(data[p]);
        str = str ? str + '&' + kvp : (str + kvp);
    }
    return str;
}

module.exports = TwitterSearchApi;