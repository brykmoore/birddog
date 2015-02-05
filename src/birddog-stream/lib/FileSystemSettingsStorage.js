/**
 *
 * Module dependencies.
 */
var fs = require('fs'),
    path = require('path'),
    Stream = require('stream');

/**
 * FileSystemSettingsStorage.
 *
 * @constructor
 */
function FileSystemSettingsStorage(args)  {
    this.settingsPath = args['settingsPath'];
    this.modules = args["modules"];

    this.moduleSettingsFile = this.getSettingsPath('module.json');

    // twitter
    this.mapperSettingsFile = this.getSettingsPath('mappers.json');
    this.filterSettingsFile = this.getSettingsPath('filters.json');
    this.schedulesSettingsFile = this.getSettingsPath('schedules.json');

    // yahoo
    this.pollingSettingsFile = this.getSettingsPath('polling.json');
    this.symbolsSettingsFile = this.getSettingsPath('symbols.json');
    this.attributesSettingsFile = this.getSettingsPath('attributes.json');
}

FileSystemSettingsStorage.prototype.getSettingsPath = function (settingsName) {
    return path.join(process.cwd(), 'settings', this.settingsPath, settingsName);
};

/**
 *
 * @param callback
 */
FileSystemSettingsStorage.prototype.getAllSettings = function(callback) {

    var that = this,
        index = 0,
        modules = this.modules,
        moduleCount = modules.length,
        settings = {};

    (function loadSettingsModule() {
        if(index < moduleCount) {
            var module = modules[index];
            var modulePath = that.getSettingsPath(module + '.json');
            fs.readFile(modulePath, { encoding: 'utf8' }, function(err, json) {
                if(err) callback && callback(err);
                else {
                    settings[module] = JSON.parse(json);
                    loadSettingsModule();
                    index++;
                }
            });
        } else {
            callback && callback(null, settings);
        }
    })();
};

FileSystemSettingsStorage.prototype.getSettings = function(module, callback) {
    var path = this.getSettingsPath(module + '.json');
    fs.readFile(path, { encoding: 'utf8' }, function(err, json) {
        if(err) callback && callback(err);
        else {
            callback(null, JSON.parse(json));
        }
    });
}

FileSystemSettingsStorage.prototype.getSchedules = function(callback) {
    this.getSettings('schedules', callback);
}

/**
 *
 * @param callback
 */
FileSystemSettingsStorage.prototype.getModuleStream = function() {
    return createConfigStream(this.moduleSettingsFile);
};

// twitter stream

/**
 *
 * @param callback
 */
FileSystemSettingsStorage.prototype.getFilterStream = function() {
    return createConfigStream(this.filterSettingsFile);
};

/**
 *
 * @param callback
 */
FileSystemSettingsStorage.prototype.getMapperStream = function() {
    return createConfigStream(this.mapperSettingsFile);
};

/**
 *
 * @param callback
 */
FileSystemSettingsStorage.prototype.getScheduleStream = function() {
    return createConfigStream(this.schedulesSettingsFile);
};

/**
 *
 * @param filters
 * @param callback
 */
FileSystemSettingsStorage.prototype.storeFilters = function(transform, callback) {
    storeSettings(this.filterSettingsFile, transform, callback);
};

/**
 *
 * @param mappers
 * @param callback
 */
FileSystemSettingsStorage.prototype.storeMappers = function(transform, callback) {
    storeSettings(this.mapperSettingsFile, transform, callback);
};

/**
 *
 * @param mappers
 * @param callback
 */
FileSystemSettingsStorage.prototype.storeSchedules = function(transform, callback) {
    storeSettings(this.schedulesSettingsFile, transform, callback);
};

// yahoo finance

/**
 *
 * @param callback
 */
FileSystemSettingsStorage.prototype.getPollingStream = function() {
    return createConfigStream(this.pollingSettingsFile);
};

/**
 *
 * @param callback
 */
FileSystemSettingsStorage.prototype.getSymbolStream = function() {
    return createConfigStream(this.symbolsSettingsFile);
};

/**
 *
 * @param callback
 */
FileSystemSettingsStorage.prototype.getAttributeStream = function() {
    return createConfigStream(this.attributesSettingsFile);
};

FileSystemSettingsStorage.prototype.getAttributeSettings = function(callback) {
    var modulePath = this.getSettingsPath('attributes.json');
    fs.readFile(modulePath, { encoding: 'utf8' }, function(err, json) {
        if(err) callback && callback(err);
        else {
            callback(null, JSON.parse(json));
        }
    });
};

/**
 *
 * @param filters
 * @param callback
 */
FileSystemSettingsStorage.prototype.storePolling = function(transform, callback) {
    storeSettings(this.pollingSettingsFile, transform, callback);
};

/**
 *
 * @param mappers
 * @param callback
 */
FileSystemSettingsStorage.prototype.storeSymbols = function(transform, callback) {
    storeSettings(this.symbolsSettingsFile, transform, callback);
};

/**
 *
 * @param mappers
 * @param callback
 */
FileSystemSettingsStorage.prototype.storeAttributes = function(transform, callback) {
    storeSettings(this.attributesSettingsFile, transform, callback);
};

/**
 * Helpers.
 */

//function getSettingsPath(settingsName) {
//    return path.join(process.cwd(), 'settings', settingsName);
//}

//var moduleSettingsFile = getSettingsPath('module.json'),
//
//    // twitter
//    mapperSettingsFile = getSettingsPath('mappers.json'),
//    filterSettingsFile = getSettingsPath('filters.json'),
//    schedulesSettingsFile = getSettingsPath('schedules.json'),
//
//    // yahoo
//    pollingSettingsFile = getSettingsPath('polling.json'),
//    symbolsSettingsFile = getSettingsPath('symbols.json'),
//    attributesSettingsFile = getSettingsPath('formats.json')
//    ;

function createConfigStream(configFileName) {
    return fs.createReadStream(configFileName);
}

function storeSettings(file, transform, callback) {
    fs.readFile(file, { encoding: 'utf8'}, function(err, data) {
        if(err) callback && callback(err);
        else {
            var obj = JSON.parse(data);
            var transformed = typeof transform === 'function' ? transform(obj) : transform;
            fs.writeFile(file, JSON.stringify(transformed, null, '\t'), function(err){
                if(err) callback && callback(err);
                else callback && callback(null, transformed);
            });
        }
    });
}

/**
 *
 * @type {Function}
 */
module.exports = FileSystemSettingsStorage;