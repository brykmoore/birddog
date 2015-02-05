
angular.module('birddog.configuration.attributes', [
        'ui.router'
    ])

.config(function($stateProvider) {
    $stateProvider.state('configuration.attributes', {
        url: '/attributes',
        templateUrl: '/configuration/attributes.html',
        controller: 'AttributeCtrl'
    });
})

.controller ('AttributeCtrl', function($scope, $http, $rootScope, $location){
    $http.get('/api/attributes').
        success(function(data, status, headers, config) {
            $scope.attributeNameList = data.attributeNameList;
            $scope.attributeSettings = {};
            for(var i = 0; i < data.attributeSettings.length; i++) {
                $scope.attributeSettings[data.attributeSettings[i]] = true;
            }
        }).
        error(function(data, status, headers, config) {
            console.log(data);
        });

    $scope.saveAttributes = function() {

        var attributeSettings = [];

        for(var p in $scope.attributeSettings) {
            if($scope.attributeSettings[p]) {
                attributeSettings.push(p);
            }
        }

        $http({method: 'POST', url: '/api/attributes', data: JSON.stringify(attributeSettings)})
            .success(function(data, status, headers, config) {
                $scope.attributeForm.$setPristine(true);

            })
            .error(function(data, status, headers, config) {

            });
    };
})

;