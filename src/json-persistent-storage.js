(function (exports) {

    var fs = require('fs');
    var path = require('path');
    // TODO: Remove mkdirp dependency and force the storage directory to be created before.
    var mkdirp = require('mkdirp');

    var EXTENSION = '.json';
    // TODO: Configurabe extension.
    function getFilePath(directory, fileName) { return buidFilePath(directory, fileName, EXTENSION); }
    var noop = function () { };

    var cl = console.log;

    function JsonPersistentStorage(_path) {
        if (!(this instanceof JsonPersistentStorage)) {
            return new JsonPersistentStorage(_path);
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
                try {
                    data = JSON.parse(data);
                } catch (err) {
                    return cb(err);
                }
                cb(null, data);
            });
        }

        function setItem(key, value, cb) {
            cb = checkCallBack(cb);

            var keyValidationResult = validateKey(key, keys);
            if (!keyValidationResult.isValid) { return cb(new Error(keyValidationResult.message)); }

            var value;
            try {
                value = JSON.stringify(value);
            } catch (err) {
                err.n = 0;
                return cb(err);
            }

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

    /**
     * @summary Checks if the callback is provided. If provided, it must be a function, otherwise default to noop.
     * @param {any} callback The callback to check.
     * @return {function} Return the callback to use. It can be the given one or the noop.
     */
    function checkCallBack(callback) {
        if (typeof callback === 'undefined') { return noop; }
        else if (typeof callback !== 'function') { throw new Error('cb must be a function'); }
        else { return callback; }
    }

    /**
     * @summary Checks if the key is valid. It includes checking if the key has a separator as defined by `path.sep`.
     * @param {string} key The key to check.
     * @param {string[]} keys All the keys in the cache.
     * @returns {ValidationResult} Does the key contain a separator?
     */
    function validateKey(key, keys) {

        /**
         * @typedef ValidationResult
         * @property {boolean} isValid Is the key valid?
         * @property {boolean} isPresent Is the key present in the cache?
         * @property {number} atIndex If the key is present, the index in the given keys array.
         * @property {string} message The error message in case the key is not valid.
         */
        var result = {};

        result.isValid = typeof key === 'string';
        if (!result.isValid) {
            result.message = 'key must be a string';
            return result;
        }

        var separatorIndex = key.indexOf(path.sep);
        result.isValid = separatorIndex === -1;
        if (!result.isValid) {
            result.message = 'key must not contain a separator. Found at index ' + separatorIndex;
            return result;
        }

        result.atIndex = keys.indexOf(key);
        result.isPresent = result.atIndex > -1;

        return result;
    }

    /**
     * @summary Format the relative file path of a given file name.
     * @param {string} directory The directory 
     */
    function buidFilePath(directory, fileName, extension) {
        return path.format({
            dir: directory,
            name: fileName,
            ext: extension,
        });
    }

    // NodeJS
    if (typeof exports !== 'undefined') {
        exports.JsonPersistentStorage = JsonPersistentStorage;
    }

})(exports);
