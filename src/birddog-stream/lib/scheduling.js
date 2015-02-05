/**
 * Module Dependencies.
 *
 */
var events = require('events'),
    util = require('util');

/**
 * Schedule.
 *
 * @param data
 * @constructor
 */
function Schedule(data) {
    this.startDate = data.startDate ? new Date(data.startDate) : null;
    this.startDateTime = this.startDate && this.startDate.getTime();
    this.endDate = data.endDate ? new Date(data.endDate) : null;
    this.endDateTime = this.endDate && this.endDate.getTime();
    this.days = data.days;

    this.dailyStartMillisecond = getDailyStartMillisecondFromScheduleData(data);
    this.dailyEndMillisecond = getDailyEndMillisecondFromScheduleData(data);
}

Schedule.prototype.isActive = function(date) {
    var millisecondsElapsedToday = getDailyMillisecondFromDate(date),

        isActiveDate = true,
        isActiveTime = true,

        beginningOfToday = new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        beginningOfTodayTime = beginningOfToday.getTime(),

        days = this.days || [0,1,2,3,4,5,6],

        startDate = this.startDate,
        endDate = this.endDate,

        startDateTime,
        endDateTime,

        dailyStartMillisecond = this.dailyStartMillisecond,
        dailyEndMillisecond = this.dailyEndMillisecond
        ;

    if(startDate) {
        startDateTime = startDate.getTime();
    }

    if(endDate) {
        endDateTime = endDate.getTime();
    }


    /*
     * Schedule will never be active if there is no start date.
     */
    if(!startDate) {
        console.log('*** Schedule *** There is no configured start date.');
        return false;
    }

    /*
     *  If there is a start time or an end time configured
     *      If the current time is before the configured start time
     *      Or the current time is after the configured end time
     *          The schedule is not active.
     */
    if(dailyStartMillisecond || dailyEndMillisecond) {
        if((millisecondsElapsedToday < dailyStartMillisecond || (dailyEndMillisecond && millisecondsElapsedToday > dailyEndMillisecond))) {
            isActiveTime = false;
            console.log('*** Schedule *** Either the configured start time has not elapsed or the configured end time has.')
        }
    }

    /*
     *  If there is an end date configured
     *      If the configured start date is today or before today
     *      And there is no end date or today is before the end date
     *         The schedule is active.
     */
    if(endDate) {
        isActiveDate = startDateTime <= beginningOfTodayTime &&
            (!endDateTime || beginningOfTodayTime <= endDateTime);
        console.log('*** Schedule *** Today is within the configured date range.')
    }

    var day = date.getUTCDay();

    /*
     *  If the current UTC day is not configured, the date is NOT active.
     */
    if(days.indexOf(day) == -1) {
        isActiveDate = false;
        console.log('*** Schedule *** Schedule is configured as inactive for the day of the week.');
    }

    var isActive = isActiveDate && isActiveTime;

    if(isActive) {
        console.log('*** Schedule *** Schedule is active.');
    }

    return isActive;
};

Schedule.prototype.getMillisecondsUntilNextStateChange = function(date) {
    var nowTime = date.getTime(),
        millisecondsElapsedToday = getDailyMillisecondFromDate(date),
        todayBeginning = new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        todayBeginningTime = todayBeginning.getTime(),
        nextChange,

        startDate = this.startDate,
        startDateTime = this.startDateTime,
        endDate = this.endDate,
        endDateTime = this.endDateTime,

        dailyStartMillisecond = this.dailyStartMillisecond,
        dailyEndMillisecond = this.dailyEndMillisecond
        ;

    /*
     *  There has to be a start date or the schedule will never return a next check time.
     */
    if(!startDate) {
        console.log('*** Schedule *** start date is not configured.')
        return null;
    }

    /*
     *  If today started before the configured start date
     *      And right now is before the configured start date
     *          And a specific start time is configured
     *              Check again on the configured start date at the configured start time
     *              (Subtract "Now" to get the right millisecond to run the scheduler)
     *
     *  If Today started ON the configured start date
     *      And a specific start time is configured and right now is less than the configured start time
     *          Check again on the configured start date at the configured start time
     *          (Subtract "Now" to get the right millisecond to run the scheduler)
     */
    if(todayBeginningTime < startDateTime) {
        if(nowTime < startDateTime) {
            if(dailyStartMillisecond) {
                console.log('*** Schedule *** configured start date has not been reached and a specific start time is configured.');
                nextChange = (startDateTime + dailyStartMillisecond) - nowTime;
            } else {
                console.log('*** Schedule *** configured start date has not been reached and a specific start time is not configured.');
                nextChange = startDateTime - nowTime;
            }
        } else {
            console.log('*** Schedule *** the current time is after the daily start time.');
        }
    } else if (todayBeginningTime == startDateTime) { /* startDate is configured without time. */
        if(dailyStartMillisecond && millisecondsElapsedToday < dailyStartMillisecond) {
            console.log('*** Schedule *** configured start date is today and milliseconds elapsed are prior to the scheduled start time.');
            nextChange = (startDateTime + dailyStartMillisecond) - nowTime;
        } else if(dailyEndMillisecond && millisecondsElapsedToday < dailyEndMillisecond) {
            console.log('*** Schedule *** configured start date is today and milliseconds elapsed are prior to the scheduled end time.');
            nextChange = (startDateTime + dailyEndMillisecond) - nowTime;
        } else {
            console.log('*** Schedule *** configured start date is today. Specific start time and end time are either not configured or have already elapsed.');
        }
    } else {
        console.log('*** Schedule *** start date has already elapsed.');
    }

    if(nextChange) {
        return nextChange;
    }

    /*
     *  The current date is after the configured start date.
     *
     *  If there is no configured end date or it has not been reached
     *      If the milliseconds elapsed today is less than the configured daily start time
     *          Check again when the configured start time has been reached
     *          (Subtract out the milliseconds elapsed today)
     *      If the milliseconds elapsed today is less than the configured daily end time
     *          Check again when the configured end time has been reached
     *          (Subtract out the milliseconds elapsed today)
     *      If there is a daily start time configured and the next schedule check has not been determined
     *          Check again at the next daily start time.
     */
    if(!endDate || todayBeginningTime <= endDateTime) {
        if(dailyStartMillisecond && millisecondsElapsedToday < dailyStartMillisecond) {
            console.log('*** Schedule *** Schedule is within the date range and the configured start time has not been reached today.');
            nextChange = dailyStartMillisecond - millisecondsElapsedToday;
        } else if(dailyEndMillisecond && millisecondsElapsedToday < dailyEndMillisecond) {
            console.log('*** Schedule *** Schedule is within the date range and the configured end time has not been reached today.');
            nextChange = dailyEndMillisecond - millisecondsElapsedToday;
        } else if(dailyStartMillisecond) {
            console.log('*** Schedule *** Schedule is within the date range and it is after the configured start time and end time.');
            nextChange = dailyStartMillisecond + (86400000 - millisecondsElapsedToday);
        }

        if(nextChange)
            return nextChange;
    }

    /*
     *  Today is after the configured start date and start and end times do not apply.
     *
     *  If there is an end date configured
     *      If today started before the end of the configured end date.
     *          Check again at the end of the configured end date.
     *      If today started after the configured end date.
     *          This schedule should not report active.
     */
    if(endDate) {
        if(nowTime <= endDateTime + 86400000) {
            nextChange = (endDateTime + 86400000) - nowTime;
            console.log('*** Schedule *** Current date is less than the configured end date time.');
        } else if(nowTime > endDateTime) {
            console.log('*** Schedule *** Current date -- ' + date.toJSON() + ' -- is after the scheduled end date -- ' + endDate.toJSON() + '.');
        } else {
            console.log('*** Schedule *** End date is configured but state is indeterminate.');
        }
    } else {
        console.log('*** Schedule *** No end date is configured.')
    }

    return nextChange;
};

/**
 * Scheduler.
 *
 * @constructor
 */
function Scheduler() {
    this.nextTimeout = -1;
}

util.inherits(Scheduler, events.EventEmitter);

Scheduler.prototype.setSchedules = function(scheduleData) {
    this.schedules = scheduleData.map(function(schedule) {
        return new Schedule(schedule);
    });
}

Scheduler.prototype.start = function() {
    processSchedules(this);
};

Scheduler.prototype.stop = function() {
    if(this.nextTimeout && this.nextTimeout != -1) {
        console.log('*** Scheduler *** Stopping Scheduler...');
        clearTimeout(this.nextTimeout);
    } else {
        console.log('*** Scheduler *** Scheduler is already stopped...');
    }
};

function processSchedules(scheduler) {
    console.log('*** Scheduler *** Processing schedules...');

    var now = new Date(),
        schedules = scheduler.schedules,
        activeSchedules = scheduler.schedules.filter(function(schedule) {
            return schedule.isActive(now);
        });

    var isActive = activeSchedules.length > 0;

    if(isActive) {
        console.log('*** Scheduler *** Found active schedules.');
        scheduler.emit('active', activeSchedules);
    } else {
        console.log('*** Scheduler *** No active schedules found.');
        scheduler.emit('inactive');
    }

    if(scheduler.nextTimeout && scheduler.nextTimeout != -1) {
        clearTimeout(scheduler.nextTimeout);
    }

    scheduler.nextTimeout = -1;

    var millisecondsUntilNextTimeout = findShortestTimeUntilNextStateChange(schedules, now);

    console.log('*** Scheduler *** Schedules processed at: ' + now.toJSON());

    if(millisecondsUntilNextTimeout != null) {
        if(millisecondsUntilNextTimeout > 2147483647) 
            millisecondsUntilNextTimeout = 2147483647;
        var scheduleProcessor = function() { processSchedules(scheduler); };
        scheduler.nextTimeout = setTimeout(scheduleProcessor, millisecondsUntilNextTimeout);
        console.log('*** Scheduler *** Future schedules exist. Schedules will be processed again in: ' + millisecondsUntilNextTimeout + ' milliseconds.')
        console.log('*** Scheduler *** Future schedules exist. Schedules will be processed again at: ' + new Date(now.getTime() + millisecondsUntilNextTimeout).toJSON())
    } else {
        console.log('*** Scheduler *** No future schedules exist. Will not process schedules again.');
    }
}

function findShortestTimeUntilNextStateChange(schedules, now) {
    var millisecondsUntilNextTimeout = null;
    schedules.forEach(function(schedule){
        var millisecondsUntilNextStateChange = schedule.getMillisecondsUntilNextStateChange(now);
        if((millisecondsUntilNextTimeout == null || 
            millisecondsUntilNextStateChange < millisecondsUntilNextTimeout) &&
            millisecondsUntilNextStateChange > 0) {
            millisecondsUntilNextTimeout = millisecondsUntilNextStateChange;
        }
    });
    return millisecondsUntilNextTimeout;
}

function getDailyMillisecondFromDate(date) {
    var hour = date.getUTCHours(),
        minutes = date.getUTCMinutes(),
        seconds = date.getUTCSeconds(),
        milliseconds = date.getUTCMilliseconds();

    return getMillisecondsFromHour(hour) + getMillisecondsFromMinute(minutes) + (seconds * 1000) + milliseconds;
}

function getDailyStartMillisecondFromScheduleData(scheduleData) {
    if(!scheduleData.dailyStartTime) {
        return undefined;
    }

    return getMillisecondsFromHour(scheduleData.dailyStartTime.hour) + getMillisecondsFromMinute(scheduleData.dailyStartTime.minute);
}

function getDailyEndMillisecondFromScheduleData(scheduleData) {
    if(!scheduleData.dailyEndTime) {
        return undefined;
    }

    return getMillisecondsFromHour(scheduleData.dailyEndTime.hour) + getMillisecondsFromMinute(scheduleData.dailyEndTime.minute);
}

function getMillisecondsFromHour(hour) {
    return hour*3600000;
}

function getMillisecondsFromMinute(minute) {
    return minute*60000;
}

/**
 * exports.
 *
 * @type {{Scheduler: Scheduler, Schedule: Schedule}}
 */
module.exports = {
    Scheduler: Scheduler,
    Schedule: Schedule
};