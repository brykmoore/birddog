angular.module('birddog.configuration.symbols', [
    'ui.router'
])

.config(function($stateProvider) {
    $stateProvider.state('configuration.symbols', {
        url: '/symbols',
        templateUrl: '/configuration/symbols.html',
        controller: 'SymbolCtrl'
    });
})

.controller ('SymbolCtrl', function($scope, $http, $rootScope, $location){
    $scope.symbols = [];

    $http.get('/api/symbols').
        success(function(data, status, headers, config) {
            $scope.symbols = data;
        }).
        error(function(data, status, headers, config) {
            console.log(data);
        });

    $scope.inputs = {
        newSymbol: ''
    };

    $scope.addSymbol = function() {
        $scope.symbols.push($scope.inputs.newSymbol);
        $scope.symbolForm.$setDirty(true);
        $scope.inputs.newSymbol = '';
    };

    $scope.removeSymbol = function(symbol) {
        var index = $scope.symbols.indexOf(symbol);
        $scope.symbols.splice(index, 1);
        $scope.symbolForm.$setDirty(true);
    };

    $scope.saveSymbols = function() {
        $http({method: 'POST', url: '/api/symbols', data: JSON.stringify($scope.symbols)})
            .success(function(data, status, headers, config) {
                $scope.symbolForm.$setPristine(true);

            })
            .error(function(data, status, headers, config) {

            });
    };
})

;