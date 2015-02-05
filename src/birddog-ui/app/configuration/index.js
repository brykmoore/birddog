angular.module('birddog.configuration', [
    'ui.router',
    'birddog.configuration.filters',
    'birddog.configuration.mappers',
    'birddog.configuration.schedules',
    'birddog.configuration.symbols',
    'birddog.configuration.attributes'
])

.config(function($stateProvider) {
    $stateProvider.state('configuration', {
        url: '/configuration',
        templateUrl: '/configuration/index.html',
        controller: 'IndexCtrl'
    });
})

.controller ('IndexCtrl', function($scope, $http, $rootScope, $location){
    //$location.path('/configuration/filters')

    $scope.isRouteVisible = function(name) {
        var cm = $rootScope.streamHandlerConfigModules;
        for(var i = 0; i < cm.length; i++) {
            if(cm[i] == name) {
                return true;
            }
        }
        return false;
    };
})

;