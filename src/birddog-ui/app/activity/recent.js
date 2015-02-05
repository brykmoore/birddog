angular.module('birddog.activity.recent', [
    'ui.router'
])

.config(function($stateProvider) {
    $stateProvider.state('activity.recent', {
        url: '/recent',
        templateUrl: '/activity/recent.html',
        controller: 'RecentActivityCtrl'
    })
})

.controller('RecentActivityCtrl', function($scope, $http, $rootScope, $location) {
    $scope.serverStatus = 'Unknown';
    $scope.streamStatus = 'Unknown';
    $scope.recentActivity = [];

    var timeoutDuration = 1500;
    var recentLimit = 40;

    // timeout is cleared on scope destroy.
    var timeoutId = null;

    function getRecent() {
        $http.get('/streamHandlers/recent?limit=' + recentLimit)
            .success(function(data, status, headers, config) {
                var posts = [];
                for(var i = 0; i < data.length; i++) {
                    var fields = [],
                        values = [];
                    for(var p in data[i]) {
                        fields.push(p);
                        values.push(data[i][p]);
                    }
                    posts.push({
                        fields: fields,
                        values: values
                    });
                }
                $scope.recentActivity = posts;
                timeoutId = setTimeout(getRecent, timeoutDuration);
            })
            .error(function(data, status, headers, config) {
                console.log('error: #getRecentWithTimeout()');
            });
    }

    $http.get('/api/status').
        success(function(data, status, headers, config) {
            $scope.serverStatus = data.server;
            $scope.streamStatus = data.stream;
        }).
        error(function(data, status, headers, config) {
            $scope.serverStatus = 'Unknown';
            $scope.streamStatus = 'Unknown';
        });

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

    $scope.$on('$destroy', function (event) {
        clearTimeout(timeoutId);
        console.log('scope -> destroy');
    });

    getRecent();
})