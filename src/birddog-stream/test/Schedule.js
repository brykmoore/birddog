var assert = require('assert'),
    Schedule = require('../lib/scheduling').Schedule;

describe.only('Schedule', function() {
    describe('#isActive', function() {
        it('should return true when date is within the date range and daily start time and end time.', function() {
            var schedule = new Schedule(	{
                "startDate": "2014-01-14T00:00:00.000Z",
                "endDate": "2014-06-15T00:00:00.000Z",
                "dailyStartTime": {
                    "hour": "17",
                    "minute": "12"
                },
                "dailyEndTime": {
                    "hour": "17",
                    "minute": "14"
                },
                "isActive": true
            });

            var now = new Date('2014-01-14T17:12:41.215Z');
            var isActive = schedule.isActive(now);
            assert(isActive, "isActive should report true.")
        });

        it('should return true when date is greater than start date and less than end date.', function() {
            var schedule = new Schedule({
                startDate: new Date("2013-12-28T00:00:00.000Z"),
                endDate: new Date("2014-12-28T00:00:00.000Z")
            });
            var now = new Date("2014-02-28T01:28:18.349Z");
            var isActive = schedule.isActive(now);
            assert(isActive, "isActive should report true.");
        });

        it('should return false when date is less than start date.', function() {
            var schedule = new Schedule({
                startDate: new Date("2013-12-28T00:00:00.000Z"),
                endDate: new Date("2014-12-28T00:00:00.000Z")
            });
            var now = new Date("2013-06-28T01:28:18.349Z");
            var isActive = schedule.isActive(now);
            assert(!isActive, "isActive should report false.");
        });

        it('should return false when date is within the date range but time is less than start time.', function() {
            var schedule = new Schedule({
                startDate: new Date("2013-12-28T00:00:00.000Z"),
                endDate: new Date("2014-12-28T00:00:00.000Z"),
                dailyStartTime: {
                    hour: 5,
                    minute: 0
                },
                dailyEndTime: {
                    hour: 8,
                    minute: 0
                }
            });
            var now = new Date("2014-02-28T01:28:18.349Z");
            var isActive = schedule.isActive(now);
            assert(!isActive, "isActive should report false.");
        });

        it('should return true when date is within the date range and time is within the time range.', function() {
            var schedule = new Schedule({
                startDate: new Date("2013-12-28T00:00:00.000Z"),
                endDate: new Date("2014-12-28T00:00:00.000Z"),
                dailyStartTime: {
                    hour: 5,
                    minute: 0
                },
                dailyEndTime: {
                    hour: 8,
                    minute: 0
                }
            });
            var now = new Date("2013-02-28T06:28:18.349Z");
            var isActive = schedule.isActive(now);
            assert(!isActive, "isActive should report false.");
        });

        it('should return false when date is the same day as start date but time is less than start time.', function() {
            var schedule = new Schedule({
                startDate: new Date("2013-12-28T00:00:00.000Z"),
                endDate: new Date("2014-12-28T00:00:00.000Z"),
                dailyStartTime: {
                    hour: 5,
                    minute: 0
                },
                dailyEndTime: {
                    hour: 8,
                    minute: 0
                }
            });
            var now = new Date("2013-12-28T01:28:18.349Z");
            var isActive = schedule.isActive(now);
            assert(!isActive, "isActive should report false.");
        });

        it('should return true when date range is not defined and time is between start time and end time.', function() {
            var schedule = new Schedule({
                dailyStartTime: {
                    hour: 5,
                    minute: 0
                },
                dailyEndTime: {
                    hour: 8,
                    minute: 0
                }
            });
            var now = new Date("2014-02-28T06:28:18.349Z");
            var isActive = schedule.isActive(now);
            assert(isActive, "isActive should report true.");
        });

        it('should return false when date range is not defined and time is greater than start time and end time.', function() {
            var schedule = new Schedule({
                dailyStartTime: {
                    hour: 5,
                    minute: 0
                },
                dailyEndTime: {
                    hour: 8,
                    minute: 0
                }
            });
            var now = new Date("2014-02-28T10:28:18.349Z");
            var isActive = schedule.isActive(now);
            assert(!isActive, "isActive should report false.");
        });

        it('should return false when date range is not defined and time is less than start time and end time.', function() {
            var schedule = new Schedule({
                dailyStartTime: {
                    hour: 5,
                    minute: 0
                },
                dailyEndTime: {
                    hour: 8,
                    minute: 0
                }
            });
            var now = new Date("2014-02-28T02:28:18.349Z");
            var isActive = schedule.isActive(now);
            assert(!isActive, "isActive should report false.");
        });
    });

    describe('#getMillisecondsUntilNextStateChange()', function() {
        it('should return the number of milliseconds until the daily end time when date is within the date range and daily start time and end time.', function() {
            var schedule = new Schedule(	{
                "startDate": "2014-01-14T00:00:00.000Z",
                "endDate": "2014-06-15T00:00:00.000Z",
                "dailyStartTime": {
                    "hour": "13",
                    "minute": "25"
                },
                "dailyEndTime": {
                    "hour": "20",
                    "minute": "35"
                },
                "isActive": true
            });

            var now = new Date('2014-05-27T01:18:46.347Z');
            var millisecondsUntilNextStateChange = schedule.getMillisecondsUntilNextStateChange(now);
            console.log(millisecondsUntilNextStateChange);
            console.log(new Date(now.getTime() + millisecondsUntilNextStateChange));
        });

        it('should return the number of milliseconds until the next start time when the start time has not passed.', function() {
            var schedule = new Schedule({
                dailyStartTime: {
                    hour: 6,
                    minute: 0
                },
                dailyEndTime: {
                    hour: 13,
                    minute: 0
                }
            });
            var now = new Date("2014-02-28T00:28:18.349Z");
            var millisecondsUntilNextStateChange = schedule.getMillisecondsUntilNextStateChange(now);
            console.log(millisecondsUntilNextStateChange);
            console.log(new Date(now.getTime() + millisecondsUntilNextStateChange));
        });

        it('should return the number of milliseconds until the next end time when the start time has elapsed.', function() {
            var schedule = new Schedule({
                dailyStartTime: {
                    hour: 6,
                    minute: 0
                },
                dailyEndTime: {
                    hour: 13,
                    minute: 0
                }
            });
            var now = new Date("2014-02-28T12:28:18.349Z");
            var millisecondsUntilNextStateChange = schedule.getMillisecondsUntilNextStateChange(now);
            console.log(millisecondsUntilNextStateChange);
            console.log(new Date(now.getTime() + millisecondsUntilNextStateChange));
        });

        it('should return the number of milliseconds until the start time of the next day when the end time has elapsed.', function() {
            var schedule = new Schedule({
                dailyStartTime: {
                    hour: 6,
                    minute: 0
                },
                dailyEndTime: {
                    hour: 13,
                    minute: 0
                }
            });
            var now = new Date("2014-02-28T20:28:18.349Z");
            var millisecondsUntilNextStateChange = schedule.getMillisecondsUntilNextStateChange(now);
            console.log(millisecondsUntilNextStateChange);
            console.log(new Date(now.getTime() + millisecondsUntilNextStateChange));
        });

        it('should return the number of milliseconds until the start date when the start date has not elapsed.', function() {
            var schedule = new Schedule({
                startDate: new Date("2014-01-15T00:00:00.000Z"),
                endDate: new Date("2014-01-16T00:00:00.000Z")
            });

            var now = new Date("2014-01-14T02:28:18.349Z");
            var millisecondsUntilNextStateChange = schedule.getMillisecondsUntilNextStateChange(now);
            console.log(millisecondsUntilNextStateChange);
            console.log(new Date(now.getTime() + millisecondsUntilNextStateChange));
        });

        it('should return the number of milliseconds until the end date when the start date has elapsed but the end date has not and there is not start time or end time.', function() {
            var schedule = new Schedule({
                startDate: new Date("2013-12-28T00:00:00.000Z"),
                endDate: new Date("2014-01-17T00:00:00.000Z")
            });

            var now = new Date("2014-01-14T02:28:18.349Z");
            var millisecondsUntilNextStateChange = schedule.getMillisecondsUntilNextStateChange(now);
            console.log(millisecondsUntilNextStateChange);
            console.log(new Date(now.getTime() + millisecondsUntilNextStateChange));
        });
    });
});