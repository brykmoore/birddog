angular.module('birddog.configuration.mappers', [
        'ui.router'
    ])

.config(function($stateProvider) {
    $stateProvider.state('configuration.mappers', {
        url: '/mappers',
        templateUrl: '/configuration/mappers.html',
        controller: 'MappersCtrl'
    });
})

.controller ('MappersCtrl', function($scope, $http, $rootScope, $location){
    $scope.allMappers = [];

    $scope.moveMapperUp = function(mapper) {
        var index = $scope.allMappers.indexOf(mapper);
        if(index == 0) return;
        var prev = $scope.allMappers[index-1];
        $scope.allMappers[index] = prev;
        $scope.allMappers[index-1] = mapper;
        $scope.mapperForm.$setDirty(true);
    };

    $scope.moveMapperDown = function(mapper) {
        var index = $scope.allMappers.indexOf(mapper);
        if(index == $scope.allMappers.length-1) return;
        var next = $scope.allMappers[index+1];
        $scope.allMappers[index] = next;
        $scope.allMappers[index+1] = mapper;
        $scope.mapperForm.$setDirty(true);
    };

    $scope.toggleMapperActive = function(mapper) {
        var index = $scope.activeMappers.indexOf(mapper);
        if(index != -1) {
            $scope.activeMappers.splice(index, 1);
        } else {
            $scope.activeMappers.push(mapper);
        }
        $scope.mapperForm.$setDirty(true);
    };

    $scope.isMapperActive = function(mapper) {
        return $scope.activeMappers.indexOf(mapper) == -1 ? "Inactive" : "Active";
    };

    $http.get('/api/mappers').
        success(function(data, status, headers, config) {
            $scope.allMappers = data.all;
            $scope.activeMappers = data.active;
        }).
        error(function(data, status, headers, config) {
            console.log(data);
        });

    $scope.save = function() {
        var mappers = {
            all: $scope.allMappers,
            active: $scope.activeMappers
        };
        $http({method: 'POST', url: '/api/mappers', data: JSON.stringify(mappers)})
            .success(function(data, status, headers, config) {
                $scope.mapperForm.$setPristine(true);
            })
            .error(function(data, status, headers, config) {

            });
    };
})

;