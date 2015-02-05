'use strict';

angular.module('birddog', [
        'ui.router',
        'birddog.services',
        'birddog.home',
        //'birddog.login',
        'birddog.activity',
        'birddog.configuration',
        'angular-loading-bar'
    ])

.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
        $stateProvider.state('notfound', {
            url: '/notfound',
            templateUrl: 'errors/404.html'
        })
        ;

    $urlRouterProvider.otherwise('notfound');

    $httpProvider.interceptors.push(function($q, $rootScope) {
        return {
            'request': function(config) {
                if($rootScope.streamHandlerName) {
                    config.headers["X-BirdDog-Stream"] = $rootScope.streamHandlerName;
                }
                return config;
            }
        };
    });
})

.run(function($rootScope, $http, $location) {
    $rootScope.user = {};

    $location.path('/');

    $http.get('streamHandlers')
        .success(function(data, status, headers, config) {
            $rootScope.streamHandlers = data;
            if(data.length == 1) {
                $rootScope.streamHandlerName = data[0].name;
                $rootScope.streamHandlerConfigModules = data[0].settingsConfig.modules;
            }
        })
        .error(function(data, status, headers, config) {
            console.warn('error on get streamHandlers');
        });
})
;
