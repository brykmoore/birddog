var apiContract = {
    "status": {methods: ["GET"]},
    "module": {methods: ["GET"]},
    "filters": {methods:["GET"]},
    "filters/track": {methods:["GET", "POST"]},
    "filters/follow": {methods:["GET", "POST"]},
    "mappers": {methods:["GET","POST"]},
    "schedules": {methods:["GET", "POST"]},
    "schedules/refresh": {methods:["GET", "POST"]},
    "symbols": {methods:["GET", "POST"]},
    "attributes": {methods:["GET", "POST"]},
    "polling": {methods:["GET", "POST"]},
    "start": {methods:["POST"]},
    "stop": {methods:["POST"]}
};

module.exports = apiContract;