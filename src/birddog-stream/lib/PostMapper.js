/**
 *
 * @param pluginMappers
 * @param selectedMappers
 * @constructor
 */
function PostMapper() {
    this.mappers = {};
    extend(this.mappers, builtInMappers);
}

/**
 *
 * @param post
 * @param callback
 */
PostMapper.prototype.map = function(post, callback) {
    if(this.selectedMappers.length == 0) {
        callback(null, post);
    } else {
        var mapped = {};
        (createInvoker(0, this.selectedMappers, this.mappers, post, mapped, callback))();
    }
};

/**
 * Set the active mappers according to the given array.
 *
 * @param selectedMappers
 */
PostMapper.prototype.setMappers = function(selectedMappers) {
    this.selectedMappers = selectedMappers || [];
};

/**
 * Mapping functions for mapping tweet into the desired form.
 *
 *  - summary pulls the bare necessity of data points into a single subdocument.
 *  - storeOriginal creates a subdocument containing the complete original tweet.
 *  - estimateMood estimates the mood.
 * @type {{summary: Function, storeOriginal: Function, estimateMood: Function}}
 */
var builtInMappers = {
    summary: function summary(post, mapped, invokeNext) {
        mapped.id_str = post.id_str;
        mapped.text = post.text;
        mapped.retweeted = post.retweeted;
        mapped.screen_name = post.user && post.user.screen_name;
        mapped.user_id_str = post.user && post.user.id_str;
        mapped.user_id = post.user && post.user.id;
        mapped.matchExplanations = post.matchExplanations;

        invokeNext();
    },
    storeOriginal: function storeOriginal(post, mapped, invokeNext) {
        mapped.originalPost = post;

        invokeNext();
    },
    estimateMood: function estimateMood(post, mapped, invokeNext) {
        if(post.text) {
            var edge = require('edge');

            var clrMethod = edge.func({
                assemblyFile: 'MoodFinder.dll',
                typeName: 'MoodFinder.MoodFinder',
                methodName: 'GetMoodBasedOnPoms'
            });

            clrMethod(post, function (error, results){
                if (error) throw error;
                else {
                    mapped.mood = results;
                    invokeNext();
                }
            });
        } else {
            invokeNext();
        }

//        mapped.mood = [{ Category: 'Vigour', Count: 2}, { Category: 'Tension', Count: 0}];
//        invokeNext();
    }
};

function extend(target, source) {
    if(!source) return;
    for(var p in source) {
        target[p] = source[p];
    }
}

function createInvoker(index, selectedMappers, mappers, post, mapped, callback) {
    return function invokeNext() {
        var selectedMapperName = selectedMappers[index++];
        var mapper = mappers[selectedMapperName];
        if(mapper) {
            mapper(post, mapped, invokeNext);
        } else {
            callback(null, mapped);
        }
    };
}

/**
 *
 * @type {Function}
 */
module.exports = PostMapper;