/**
 *
 * Module Dependencies
 */
var crypto = require('crypto');

/**
 * OAuth.
 *
 * @param authInfo
 * @param stamps
 * @constructor
 */
function OAuth(authInfo /*consumer_key, token, and secrets*/, stamps) {
    this.oauthBaseParameters = {
        "oauth_consumer_key": authInfo["consumer_key"],
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_token": authInfo["access_token"],
        "oauth_version": '1.0'
    };
    this.oauthSecrets = {
        "consumer": authInfo["consumer_secret"],
        "token": authInfo["access_token_secret"]
    };
    this.stampGenerator = {
        createNonce: stamps ? function() { return stamps.nonce;} : createNonce,
        createTimestamp: stamps ? function() { return stamps.timestamp;} : createTimestamp
    };
}

OAuth.prototype.createSigningKey = function(consumerSecret, oauthSecret) {
    return percentEncode(consumerSecret) + '&' + percentEncode(oauthSecret);
};

OAuth.prototype.createSignatureBase = function(method, url, obj) {
    var sigBase = percentEncode(method) + '&' + percentEncode(url) + '&' + percentEncode(createEncodedString(obj, '', '=', '&'));
//    console.log('SIGNATURE BASE:');
//    console.log(sigBase);
    return sigBase;
};

OAuth.prototype.createSignature = function(signingKey, signatureBase) {
    var sig = crypto.createHmac('sha1', signingKey).update(signatureBase).digest('base64');
    console.log('SIGNING KEY: ' + signingKey);
    return sig;
};

OAuth.prototype.createHeader = function(obj) {
    return 'OAuth ' + createEncodedString(obj, '"', '=', ', ');
};

OAuth.prototype.getAuthorization = function(method, url, requestParameters) {
    // nonce and timestamp need to be created anew with each request.
    var oauthParameters = {
        oauth_nonce: this.stampGenerator.createNonce(),
        oauth_timestamp: this.stampGenerator.createTimestamp()
    };

    // the 4 other oauth params are static. consumer key, token, signature method and version.
    extend(oauthParameters, this.oauthBaseParameters);

    // the signature base is built from these 6 oauth parameters + the request method, url, and parameters
    var allParams = { };
    extend(allParams, oauthParameters);
    extend(allParams, requestParameters);
    allParams = sortProperties(allParams);
    //console.log(allParams);
    var signatureBase = this.createSignatureBase(method, url, allParams);
    console.log('SIGNATURE BASE: ' + signatureBase);
    //console.log(signatureBase);
    var signingKey = this.createSigningKey(this.oauthSecrets['consumer'], this.oauthSecrets['token']);
    var signature = this.createSignature(signingKey, signatureBase);

    // the authorization header needs to name the 6 oauth parameters used for the signing base, plus the signature.
    var headerParams = { };
    extend(headerParams, oauthParameters);
    headerParams['oauth_signature'] = signature;
    headerParams = sortProperties(headerParams);
    //console.log(headerParams);
    var header = this.createHeader(headerParams);

    console.log('Authorization:' + header);
    return header;
};

function percentEncode(str) {
    // TODO: may need to additionally encode ' or other characters.
    // https://dev.twitter.com/docs/auth/percent-encoding-parameters
    return encodeURIComponent(str);
}

function createNonce() {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function createTimestamp() {
    return Math.floor(new Date().getTime() / 1000);
}

function extend(target, source) {
    for(var p in source) {
        target[p] = source[p];
    }
}

function sortProperties(obj) {
    var arr = [],
        map = {},
        sorted = {};
    for(var p in obj) {
        var encoded = percentEncode(p);
        arr.push(encoded);
        map[encoded] = p;
    }
//    console.log('before sort');
//    console.log(arr);
    arr.sort();
//    console.log('after sort');
//    console.log(arr);
    arr.forEach(function(p) {
        sorted[p] = obj[map[p]];
    });
    return sorted;
}

//function sortStringArray(arr1, arr2) {
//    if(arr1[0] < arr2[0]) return -1;
//    if(arr1[0] > arr2[0]) return 1;
//    return 0;
//}

function forEachProperty(obj, callback) {
    for(var p in obj) {
        callback(obj, p);
    }
}

//function mapProperties(obj, propertyNameCallback, propertyValueCallback) {
//    var map = {};
//    for(var p in obj) {
//        var pName = propertyNameCallback ? propertyNameCallback(p) : p;
//        var pValue = propertyValueCallback ? propertyValueCallback(pName, obj[p], obj, map) : obj[p];
//        map[pName] = pValue;
//    }
//    return map;
//}

function mapPropertyNames(obj, callback) {
    var map = {};
    for(var p in obj) {
        map[callback(p)] = obj[p];
    }
    return map;
}

function makeArray(obj, callback) {
    var mapped = [];
    for(var p in obj) {
        mapped.push(callback(obj, p));
    }
    return mapped;
}

function createEncodedString(obj, surround, eq, delim) {
    var sb = makeArray(obj, function (o, p) {
        return  percentEncode(p) + eq + surround + percentEncode(obj[p]) + surround;
    });
    return sb.join(delim);
}

module.exports = OAuth;