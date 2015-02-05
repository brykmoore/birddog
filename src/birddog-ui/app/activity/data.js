angular.module('birddog.activity.data', [
        'ui.router'
    ])

    .config(function($stateProvider) {
        $stateProvider.state('activity.data', {
            url: '/data',
            templateUrl: '/activity/data.html',
            controller: 'DataActivityCtrl'
        })
    })

    .controller('DataActivityCtrl', function($scope, $http, $rootScope, $location) {

        $scope.records = [];
        $scope.headers = [];
        $scope.skip = 0;

        $scope.next = function() {
            getData(limit, $scope.skip+=limit);
        };

        $scope.prev = function() {
            $scope.skip -= limit;
            if($scope.skip < 0) {
                $scope.skip = 0;
            }
            getData(limit, $scope.skip);
        };

        $scope.isObjectArray = function(item) {
            return Object.prototype.toString.call( item ) === '[object Array]' &&
                    item[0] &&
                    (typeof item[0]).toLowerCase() !== 'string';
        };

        $scope.isSimpleType = function(item) {
            return Object.prototype.toString.call( item ) !== '[object Array]';
        };

        var limit = 10;

        function getData(limit, skip) {
            $http.get('/streamHandlers/data?limit=' + limit + '&skip=' + $scope.skip)
                .success(function(data, status, headers, config) {
                    $scope.headers = data.headers;
                    $scope.records = data.records;
                })
                .error(function(data, status, headers, config) {
                    console.log('error: #getData()');
                });
        }
        getData(limit, $scope.skip);
    })