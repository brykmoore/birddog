angular.module('birddog.login', [
    'ui.router'
])

.config(function($stateProvider) {
    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'login/login.html',
        controller: 'LoginCtrl'
    });
})

.controller('LoginCtrl', function(){

})

;