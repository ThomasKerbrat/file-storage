var fs = require('fs');
var path = require('path');
// TODO: Remove mkdirp dependency and force the storage directory to be created before.
var mkdirp = require('mkdirp');

var checkCallBack = require('./utils.js').checkCallBack;
var validateKey = require('./utils.js').validateKey;
var buidFilePath = require('./utils.js').buidFilePath;

var EXTENSION = '';
// TODO: Configurabe extension.
function getFilePath(directory, fileName) { return buidFilePath(directory, fileName, EXTENSION); }

function FileStorage(_path) {
    if (!(this instanceof FileStorage)) {
        return new FileStorage(_path);
    }

    if (typeof _path !== 'string') {
        throw TypeError('Missing path argument');
    }

    var self = this;
    var length = 0;
    var keys = [];

    Object.defineProperty(this, 'length', { get: get_length });
    Object.assign(this, {
        key: key,
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        clear: clear,
    });

    function get_length() {
        return length;
    }

    function key(index) {
        if (typeof index !== 'number') {
            throw new TypeError('index must be a number. ' + index + 'given.');
        }

        var isIndexOutOfBounds = index < 0 || index >= keys.length;
        return isIndexOutOfBounds ? null : keys[index];
    }

    function getItem(key, cb) {
        cb = checkCallBack(cb);

        var keyValidationResult = validateKey(key, keys);
        if (!keyValidationResult.isValid) { return cb(new Error(keyValidationResult.message)); }
        if (!keyValidationResult.isPresent) { return cb(null); }

        var filePath = getFilePath(_path, key);
        fs.readFile(filePath, { encoding: 'utf8' }, function (err, data) {
            if (err) { return cb(err); }
            cb(null, data);
        });
    }

    function setItem(key, value, cb) {
        cb = checkCallBack(cb);

        var keyValidationResult = validateKey(key, keys);
        if (!keyValidationResult.isValid) { return cb(new Error(keyValidationResult.message)); }

        if (value === undefined) { value = 'undefined'; }
        if (value === null) { value = 'null'; }
        value = value.toString();

        fs.access(_path, function (err) {
            if (err !== null) {
                if (err.code === 'ENOENT') {
                    mkdirp(_path, function (err) {
                        if (err) {
                            err.n = 3;
                            cb(err);
                        } else {
                            resume();
                        }
                    });
                } else {
                    err.n = 1;
                    cb(err);
                }
            } else {
                resume();
            }
        });

        function resume() {
            var filePath = getFilePath(_path, key);
            fs.writeFile(filePath, value, { encoding: 'utf8' }, function (err) {
                if (err) {
                    err.n = 2;
                    return cb(err);
                } else {
                    if (keys.indexOf(key) === -1) {
                        keys.push(key);
                        length++;
                    }
                    cb(null);
                }
            });
        }
    }

    function removeItem(key, cb) {
        cb = checkCallBack(cb);

        var keyValidationResult = validateKey(key, keys);
        if (!keyValidationResult.isValid) { return cb(new Error(keyValidationResult.message)); }
        if (!keyValidationResult.isPresent) { return cb(null); }

        var filePath = getFilePath(_path, key);
        fs.unlink(filePath, function (err) {
            if (err) {
                cb(err);
            } else {
                keys.splice(keyValidationResult.atIndex, 1);
                length--;
                cb(null);
            }
        });
    }

    function clear(cb) {
        cb = checkCallBack(cb);

        if (keys.length === 0) { return cb(null); }

        var initialKeyCount = keys.length;
        var removeItemResultsCount = 0;
        var hasErrorOccurred = false;

        keys.forEach(function (key) {
            self.removeItem(key, function (err) {
                joinCallbacks(err);
            });
        });

        function joinCallbacks(err) {
            if (hasErrorOccurred) { return; }
            if (err) { hasErrorOccurred = true; return cb(err); }
            removeItemResultsCount++;
            if (removeItemResultsCount === initialKeyCount) { return cb(null); }
        }
    }
}

module.exports.FileStorage = FileStorage;
