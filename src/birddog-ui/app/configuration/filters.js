
function combinePathParts() {
    var path = arguments[0];
    for(var i = 1; i < arguments.length; i++) {
        var arg = arguments[i];
        var lastPathChar = path[path.length-1];
        var firstArgChar = arg[0];
        if(lastPathChar == '/' && firstArgChar == '/') {
            path = path + arg.substr(1);
        } else if(lastPathChar != '/' && firstArgChar != '/') {
            path = path + '/' + arg;
        } else {
            path = path + arg;
        }
    }
    return path;
}

angular.module('birddog.configuration.filters', [
    'ui.router'
])

.config(function($stateProvider) {
    $stateProvider.state('configuration.filters', {
        url: '/filters',
        templateUrl: '/configuration/filters.html',
        controller: 'FiltersCtrl'
    });
})

.controller ('FiltersCtrl', function($scope, $http, $rootScope, $location){
    $scope.trackFilters = [];
    $scope.followFilters = [];

    $http.get('/api/filters').
        success(function(data, status, headers, config) {
            $scope.trackFilters = _.map(data.track, function(trackFilter) {
                return trackFilter.text ? trackFilter : {
                    text: trackFilter,
                    key: '',
                    category: ''
                };
            });
            $scope.followFilters = data.follow;
        }).
        error(function(data, status, headers, config) {
            console.log(data);
        });

    $scope.inputs = {
        newTrackFilterText: '',
        newTrackFilterKey: '',
        newTrackFilterCategory: '',
        newFollowFilter: ''
    };

    $scope.addTrackFilter = function() {
        var newTrackFilter = {
            text: $scope.inputs.newTrackFilterText,
            key: $scope.inputs.newTrackFilterKey,
            category: $scope.inputs.newTrackFilterCategory
        };

        $scope.trackFilters.push(newTrackFilter);
        $scope.trackFilterForm.$setDirty(true);
        $scope.inputs.newTrackFilter = '';
    };

    $scope.removeTrackFilter = function(trackFilterText) {
        var index = -1;
        for(var i = 0; i < $scope.trackFilters.length;i++){
            if($scope.trackFilters[i].text == trackFilterText) {
                index = i;
                break;
            }
        }
        if(index > -1) {
            $scope.trackFilters.splice(index, 1);
            $scope.trackFilterForm.$setDirty(true);
        }
    };

    $scope.saveTrackFilters = function() {
        var trackFilters = [];
        for(var i = 0; i < $scope.trackFilters.length; i++) {
            trackFilters.push({
                text: $scope.trackFilters[i].text,
                key: $scope.trackFilters[i].key,
                category: $scope.trackFilters[i].category
            });
        }
        $http({method: 'POST', url: combinePathParts('/api/filters', 'track'), data: JSON.stringify(trackFilters)})
            .success(function(data, status, headers, config) {
                $scope.trackFilterForm.$setPristine(true);

            })
            .error(function(data, status, headers, config) {

            });
    };

    $scope.addFollowFilter = function() {
        $scope.followFilters.push($scope.inputs.newFollowFilter);
        $scope.followFilterForm.$setDirty(true);
        $scope.inputs.newFollowFilter = '';
    };

    $scope.removeFollowFilter = function(followFilter) {
        var index = $scope.followFilters.indexOf(followFilter);
        $scope.followFilters.splice(index, 1);
        $scope.followFilterForm.$setDirty(true);
    };

    $scope.saveFollowFilters = function() {
        $http({method: 'POST', url: combinePathParts('/api/filters', 'follow'), data: JSON.stringify($scope.followFilters)})
            .success(function(data, status, headers, config) {
                $scope.followFilterForm.$setPristine(true);

            })
            .error(function(data, status, headers, config) {

            });
    };
})

;