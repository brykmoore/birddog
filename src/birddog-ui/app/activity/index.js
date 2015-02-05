angular.module('birddog.activity', [
    'ui.router',
    'birddog.activity.health',
    'birddog.activity.data'
//        ,
//    'birddog.activity.recent'
])

.config(function($stateProvider) {
    $stateProvider.state('activity', {
        url: '/activity',
        templateUrl: '/activity/index.html',
        controller: 'ActivityCtrl'
    });
})

.controller('ActivityCtrl', function($scope, $http, $rootScope, $location) {
    //$location.path('/activity/health');
})

;