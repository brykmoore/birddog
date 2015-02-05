var assert = require('assert'),
    OAuth = require('../lib/OAuth');

describe('OAuth', function() {

    var oauth = new OAuth({
        "consumer_key": "",
        "consumer_secret": "",
        "access_token": "",
        "access_token_secret": ""
    }, {
        "nonce": "",
        "timestamp": ""
    });

    describe('#createSignatureBaseString()', function() {
        it('should return #expectedSigBaseString when given #sigBaseStringParams', function() {
            var expectedSignatureBase = '';

            var requestMethod = '';
            var requestUrl = '';
            var signatureBaseParams = '';

            var signatureBase = oauth.createSignatureBase(requestMethod, requestUrl, signatureBaseParams);
            assert.equal(expectedSignatureBase, signatureBase);
        });
    });

    describe('#createSignature()', function() {
        it('should return #expectedSig when given #sigParams', function() {
            var expectedSig = ''

            var signingKey = '';
            var signatureBase = '';

            var sig = oauth.createSignature(signingKey, signatureBase);
            assert.equal(expectedSig, sig);
        });
    });

    describe('#createHeader()', function() {
        it('should return #expectedHeader when given #headerParams', function() {
            var expectedHeader = '';

            var headerParams = {};
            var header = oauth.createHeader(headerParams);

            assert.equal(expectedHeader, header);
        });
    });

    describe('#getAuthorization()', function() {
        it('should return #expectedAuthorization when given #method, #url, and #requestParameters', function() {
            var expectedHeader = '';

            var url = 'https://api.twitter.com/1.1/search/tweets.json';
            var requestMethod = '';
            var requestUrl = '';
            var requestData = {};
            var authorization = oauth.getAuthorization(requestMethod, requestUrl, requestData);

            assert.equal(expectedHeader, authorization);

        });
    });
});
