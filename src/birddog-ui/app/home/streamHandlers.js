angular.module('birddog.home.streamHandlers', [
    'ui.router'
])

.config(function($stateProvider) {
    $stateProvider.state('home.streamHandlers', {
        url: '/streamHandlers',
        templateUrl: '/home/streamHandlers.html',
        controller: 'StreamHandlerCtrl'
    });
})

.controller ('StreamHandlerCtrl', function($scope, $http, $rootScope){
    $scope.streamHandlerNames = [];

    for(var i = 0; i < $rootScope.streamHandlers.length; i++) {
        $scope.streamHandlerNames.push($rootScope.streamHandlers[i].name);
    }

    $scope.selectStreamHandler = function(streamHandlerName) {
        $rootScope.streamHandlerName = streamHandlerName;
        for(var j = 0; j < $rootScope.streamHandlers.length; j++) {
            var sh = $rootScope.streamHandlers[j];
            if(sh.name == streamHandlerName) {
                $rootScope.streamHandlerConfigModules = sh.settingsConfig.modules;
                break;
            }
        }
    };
})
;