angular.module('birddog.home', [
    'ui.router',
    'birddog.home.streamHandlers'
])

.config(function($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'home/index.html',
        controller: 'HomeCtrl'
    });
})

.controller('HomeCtrl', function(){

})
;