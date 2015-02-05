angular.module('birddog.activity.health', [
    'ui.router'
])

.config(function($stateProvider) {
    $stateProvider.state('activity.health', {
        url: '/health',
        templateUrl: '/activity/health.html',
        controller: 'HealthCtrl'
    })
})

.controller('HealthCtrl', function($scope, $http, $rootScope, $location) {
    $scope.formatTimeAsDate = function(time) {
        if(time == null) {
            return null;
        }

        return new Date(time).toLocaleString();
    };

    $scope.fetchStreamHandlerSessions = function() {
        $http.get('/streamHandlers/sessions')
            .success(function(data, status, headers, config) {
                console.log(data);
                $scope.streamHandlerSessions = data;
            })
            .error(function(data, status, headers, config) {

            });
    };

    $scope.fetchErrors = function() {
        $http.get('/streamHandlers/errors')
            .success(function(data, status, headers, config) {
                console.log(data);
                $scope.streamHandlerErrors = data;
            })
            .error(function(data, status, headers, config) {

            });
    };

    $scope.fetchStatus = function(){
        $http.get('/api/status').
            success(function(data, status, headers, config) {
                $scope.serverStatus = data.server;
                $scope.streamStatus = data.stream;
            }).
            error(function(data, status, headers, config) {
                $scope.serverStatus = 'Unknown';
                $scope.streamStatus = 'Unknown';
            });
    };

    $scope.startStream = function() {
        $http({method: 'POST', url: 'api/start'}).
            success(function(data, status, headers, config) {
                $http.get('/api/status').
                    success(function(data, status, headers, config) {
                        $scope.serverStatus = data.server;
                        $scope.streamStatus = data.stream;
                    }).
                    error(function(data, status, headers, config) {
                        $scope.serverStatus = 'Unknown';
                        $scope.streamStatus = 'Unknown';
                    });
            }).
            error(function(data, status, headers, config) {
                $http.get('/api/status').
                    success(function(data, status, headers, config) {
                        $scope.serverStatus = data.server;
                        $scope.streamStatus = data.stream;
                    }).
                    error(function(data, status, headers, config) {
                        $scope.serverStatus = 'Unknown';
                        $scope.streamStatus = 'Unknown';
                    });
            });
    };

    $scope.stopStream = function() {
        $http({method: 'POST', url: 'api/stop'}).
            success(function(data, status, headers, config) {
                $http.get('/api/status').
                    success(function(data, status, headers, config) {
                        $scope.serverStatus = data.server;
                        $scope.streamStatus = data.stream;
                    }).
                    error(function(data, status, headers, config) {
                        $scope.serverStatus = 'Unknown';
                        $scope.streamStatus = 'Unknown';
                    });
            }).
            error(function(data, status, headers, config) {
                $http.get('/api/status').
                    success(function(data, status, headers, config) {
                        $scope.serverStatus = data.server;
                        $scope.streamStatus = data.stream;
                    }).
                    error(function(data, status, headers, config) {
                        $scope.serverStatus = 'Unknown';
                        $scope.streamStatus = 'Unknown';
                    });
            });
    };

    $scope.streamHandlerSessions = [];
    $scope.streamHandlerErrorsAndWarnings = [];


    $scope.fetchStreamHandlerSessions();
    $scope.fetchErrors();
    $scope.fetchStatus();
})
;