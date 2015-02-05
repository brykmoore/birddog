'use strict';

// http://stackoverflow.com/questions/15666048/angular-js-service-vs-provider-vs-factory
// service - you will be returned an instance of the function you passed
// factory - you will be returned the value returned by invoking the function
// provider - you will be provided with new ProviderFunction().$get(). ctor function is instantiated before $get is invoked
// Providers have the advantage that they can be configured during the module configuration phase.

angular.module('birddog.services', [])

;