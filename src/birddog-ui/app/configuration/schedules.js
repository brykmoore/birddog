angular.module('birddog.configuration.schedules', [
    'ui.router',
    'ui.bootstrap'
])

.config(function($stateProvider) {
    $stateProvider.state('configuration.schedules', {
        url: '/schedules',
        templateUrl: '/configuration/schedules.html',
        controller: 'ScheduleCtrl'
    });
})

.controller ('ScheduleCtrl', function($scope, $http, $rootScope, $location){
    var timezoneOffset = -new Date().getTimezoneOffset()/60;

    $scope.dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    $scope.schedules = [];

    $scope.toggleDay = function(day, schedule) {
        var dayNumber = $scope.dayNames.indexOf(day);
        var scheduleDayIndex = schedule.days.indexOf(dayNumber);
        if(scheduleDayIndex > -1) {
            schedule.days.splice(scheduleDayIndex, 1);
        } else {
            schedule.days.push(dayNumber);
        }
    };

    $scope.toggleScheduleActive = function(schedule) {
        schedule.isActive = !schedule.isActive;
        $scope.scheduleForm.$setDirty(true);
    };

    $scope.isScheduleActive = function(schedule) {
        if(schedule.isActive) {
            return 'Active';
        } else {
            return 'Inactive';
        }
    };

    $scope.addNew = function() {
        $scope.schedules.push({
            isActive: false,
            days: []
        });
    };

    $scope.dateOptions = {
        'year-format': "'yy'",
        'starting-day': 1
    };

    $scope.format = 'MM/dd/yyyy';

    $scope.save = function() {
        var schedules = _.map($scope.schedules, function(schedule) {
            var serverSchedule = {
                startDate: schedule.startDate,
                endDate: schedule.endDate,
                isActive: schedule.isActive,
                days: schedule.days
            };

            if(!schedule.dailyStartTime || (schedule.dailyStartTime.hour == 0 && schedule.dailyStartTime.minute == 0)) {
                serverSchedule.dailyStartTime = undefined;
            } else {
                serverSchedule.dailyStartTime = {
                    hour: +schedule.dailyStartTime.hour-timezoneOffset,
                    minute: +schedule.dailyStartTime.minute
                };
                if(serverSchedule.dailyStartTime.hour > 24) {
                    serverSchedule.dailyStartTime.hour = serverSchedule.dailyStartTime.hour - 24;
                }
            }

            if(!schedule.dailyEndTime || (schedule.dailyEndTime.hour == 0 && schedule.dailyEndTime.minute == 0)) {
                serverSchedule.dailyEndTime = undefined;
            } else {
                serverSchedule.dailyEndTime = {
                    hour: +schedule.dailyEndTime.hour-timezoneOffset,
                    minute: +schedule.dailyEndTime.minute
                };
                if(serverSchedule.dailyEndTime.hour > 24) {
                    serverSchedule.dailyEndTime.hour = serverSchedule.dailyEndTime.hour - 24;
                }
            }

            return serverSchedule;
        });
        $http({method: 'POST', url: '/api/schedules', data: JSON.stringify(schedules)})
            .success(function(data, status, headers, config) {
                $scope.scheduleForm.$setPristine(true);
                $http({method: 'POST', url: '/api/schedules/refresh'})
                    .success(function() {
                        console.log('*** Configuration *** Refreshed Schedules.');
                    })
                    .error(function() {
                        console.log('*** Configuration *** Error on Refresh Schedules.');
                    });
            })
            .error(function(data, status, headers, config) {
                console.log('*** Configuration *** Error Saving Schedules:' + data);
            });
    };

    $http.get('/api/schedules')
        .success(function(data, status, headers, config) {
            $scope.schedules = _.map(data, function(schedule){
                var clientSchedule = {
                    isActive: schedule.isActive,
                    days: schedule.days
                };
                if(schedule.startDate) {
                    clientSchedule.startDate = new Date(schedule.startDate);
                }
                if(schedule.endDate) {
                    clientSchedule.endDate = new Date(schedule.endDate);
                }
                if(schedule.dailyStartTime) {
                    clientSchedule.dailyStartTime = {
                        hour: schedule.dailyStartTime.hour+timezoneOffset,
                        minute: schedule.dailyStartTime.minute
                    };
                    if(clientSchedule.dailyStartTime.hour < 0) {
                        clientSchedule.dailyStartTime.hour = clientSchedule.dailyStartTime.hour + 24;
                    }
                }
                if(schedule.dailyEndTime){
                    clientSchedule.dailyEndTime = {
                        hour: schedule.dailyEndTime.hour+timezoneOffset,
                        minute: schedule.dailyEndTime.minute
                    }                    
                    if(clientSchedule.dailyEndTime.hour < 0) {
                        clientSchedule.dailyEndTime.hour = clientSchedule.dailyEndTime.hour + 24;
                    }
                }
                return clientSchedule;
            });
        })
        .error(function(data, status, headers, config) {

        });
})
;