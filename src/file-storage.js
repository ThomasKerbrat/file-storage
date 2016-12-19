var fs = require('fs');
var path = require('path');
// TODO: Remove mkdirp dependency and force the storage directory to be created before.
var mkdirp = require('mkdirp');

var checkCallBack = require('./utils.js').checkCallBack;
var validateKey = require('./utils.js').validateKey;
var buidFilePath = require('./utils.js').buidFilePath;
var defaults = require('./utils.js').defaults;

/** @module */

/**
 * @typedef {function} Callback
 * @param {Object|null} err The error object if something wrong appened, null otherwhise.
 * @param {string} [data] The value read from the file. For {@link getItem} only.
 */

/**
 * @summary Instantiate a new FileStorage object.
 * @constructor
 * @param {string} directory The directory in which the files will be written.
 */
function FileStorage(directory, options) {
    if (!(this instanceof FileStorage)) {
        return new FileStorage(directory);
    }

    if (typeof directory !== 'string') {
        throw TypeError('Missing path argument');
    }

    this.directory = directory;
    this.keys = [];

    Object.defineProperty(this, 'length', {
        get: function () { return this.keys.length; }
    });

    var self = this;
    options = defaults(options);

    if (options.restore === true) {
        var files = fs.readdirSync(this.directory);
        files.forEach(function (file) {
            self.keys.push(path.parse(file).name);
        });
    }
}

/**
 * @summary Get the key at index.
 * @description
 * The indexes of the keys are arbitraty.
 * They won't change until you set or remove a key.
 * @param {number} index The index at which looking for a key name.
 * @returns {string} The key at index position.
 */
FileStorage.prototype.key = function key(index) {
    if (typeof index !== 'number') {
        throw new TypeError('index must be a number. ' + index + 'given.');
    }

    var isIndexOutOfBounds = index < 0 || index >= this.keys.length;
    return isIndexOutOfBounds ? null : this.keys[index];
}

/**
 * @summary Read the item for the given key.
 * @description
 * First checks if the key exists.
 * If so, reads the content of the file named after the given key.
 * @param {string} key The key to read.
 * @param {module:file-storage~Callback} cb The function to be called when the operation succeed or fail.
 * @returns {void}
 */
FileStorage.prototype.getItem = function getItem(key, cb) {
    cb = checkCallBack(cb);

    var keyValidationResult = validateKey(key, this.keys);
    if (!keyValidationResult.isValid) { return cb(new Error(keyValidationResult.message)); }
    if (!keyValidationResult.isPresent) { return cb(null, null); }

    var filePath = buidFilePath(this.directory, key);
    fs.readFile(filePath, { encoding: 'utf8' }, cb);
}

/**
 * @summary Write the item's value for the given key.
 * @param {string} key The key under which to write the value.
 * @param {string} value The value to write. Will be coerced to a string.
 * @param {module:file-storage~Callback} cb The function to be called when the operation succeed or fail.
 * @returns {void}
 */
FileStorage.prototype.setItem = function setItem(key, value, cb) {
    cb = checkCallBack(cb);

    var keyValidationResult = validateKey(key, this.keys);
    if (!keyValidationResult.isValid) { return cb(new Error(keyValidationResult.message)); }

    value = value + '';
    var self = this;

    fs.access(this.directory, function (err) {
        if (err !== null) {
            if (err.code === 'ENOENT') {
                mkdirp(self.directory, function (err) {
                    if (err) { cb(err); }
                    else { resume(); }
                });
            } else { cb(err); }
        } else { resume(); }
    });

    function resume() {
        var filePath = buidFilePath(self.directory, key);
        fs.writeFile(filePath, value, { encoding: 'utf8' }, function (err) {
            if (err) {
                err.n = 2;
                return cb(err);
            } else {
                if (self.keys.indexOf(key) === -1) {
                    self.keys.push(key);
                }
                cb(null);
            }
        });
    }
}

/**
 * @summary Deletes the file on the file system for the given key.
 * @param {string} key The key under which to delete the value.
 * @param {module:file-storage~Callback} cb The function to be called when the operation succeed or fail.
 * @returns {void}
 */
FileStorage.prototype.removeItem = function removeItem(key, cb) {
    cb = checkCallBack(cb);

    var keyValidationResult = validateKey(key, this.keys);
    if (!keyValidationResult.isValid) { return cb(new Error(keyValidationResult.message)); }
    if (!keyValidationResult.isPresent) { return cb(null); }

    var filePath = buidFilePath(this.directory, key);
    var self = this;

    fs.unlink(filePath, function (err) {
        if (err) {
            cb(err);
        } else {
            self.keys.splice(keyValidationResult.atIndex, 1);
            cb(null);
        }
    });
}

/**
 * @summary Remove all the files accessible with {@link module:FileStorage~key}.
 * @description
 * In order to know which key to delete, the clear method does a for each loop on the keys array used internally.
 * Thus, not all files present in the storage directory will be deleted.
 * @param {module:file-storage~Callback} cb The function to be called when the operation succeed or fail.
 * @returns {void}
 */
FileStorage.prototype.clear = function clear(cb) {
    cb = checkCallBack(cb);

    if (this.keys.length === 0) { return cb(null); }

    var initialKeyCount = this.keys.length;
    var removeItemResultsCount = 0;
    var hasErrorOccurred = false;

    var self = this;

    this.keys.forEach(function (key) {
        self.removeItem(key, function (err) {
            var index = self.keys.indexOf(key);
            if (index !== -1) { self.keys.splice(index); }
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

module.exports.FileStorage = FileStorage;
