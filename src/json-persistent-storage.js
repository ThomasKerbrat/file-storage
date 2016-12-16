(function (exports) {

    var fs = require('fs');
    var path = require('path');
    // TODO: Remove mkdirp dependency and force the storage directory to be created before.
    var mkdirp = require('mkdirp');

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

        function key(index) { }

        function getItem(key) { }

        function setItem(key, value, cb) { // cl('setItem', key);
            if (typeof cb === 'undefined') { cb = noop; }
            else if (typeof cb !== 'function') { throw new Error('cb must be a function'); }

            var sepIndex = key.indexOf(path.sep)
            if (sepIndex !== -1) {
                return cb(new Error('key must not contain a separator. Found at index ' + sepIndex));
            }

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
                var filePath = path.format({ dir: _path, name: key, ext: '.json' });
                fs.writeFile(filePath, value, function (err) {
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

        function removeItem(key, cb) { // cl('removeItem', key);
            if (typeof cb === 'undefined') { cb = noop; }
            else if (typeof cb !== 'function') { throw new Error('cb must be a function'); }

            var sepIndex = key.indexOf(path.sep)
            if (sepIndex !== -1) {
                return cb(new Error('key must not contain a separator. Found at index ' + sepIndex));
            }

            var keyIndex = keys.indexOf(key);
            if (keyIndex === -1) {
                return cb(null);
            }

            var filePath = path.format({ dir: _path, name: key, ext: '.json' });
            fs.unlink(filePath, function (err) {
                if (err) {
                    cb(err);
                } else {
                    keys.splice(keyIndex, 1);
                    length--;
                    cb(null);
                }
            });
        }

        function clear(cb) {
            if (typeof cb === 'undefined') { cb = noop; }
            else if (typeof cb !== 'function') { throw new Error('cb must be a function'); }

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

    // NodeJS
    if (typeof exports !== 'undefined') {
        exports.JsonPersistentStorage = JsonPersistentStorage;
    }

})(exports);
