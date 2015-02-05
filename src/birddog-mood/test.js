var edge = require('edge');

var clrMethod = edge.func({
    assemblyFile: 'MoodFinder.dll',
    typeName: 'MoodFinder.MoodFinder',
	methodName: 'GetMoodBasedOnPoms'

});
var post = {}
post.text = 'anger anger happy tense shaky';
	
clrMethod(post, function (error, results){
	 if (error) throw error;
		console.log(results);
		//[{Category: 'Anger', Count: 2}, {Category: 'Tension', Count: 2}]
});