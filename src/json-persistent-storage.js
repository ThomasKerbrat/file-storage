(function (exports) {

    var path = require('path');
    var fs = require('fs');
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

        function setItem(key, value, cb) {
            if (typeof cb === 'undefined') { cb = noop; }
            else if (typeof cb !== 'function') { throw new Error('cb must be a function'); }

            var value;
            try {
                value = JSON.stringify(value);
            } catch (err) {
                cb(err);
            }

            fs.access(_path, function (err) {
                if (err !== null) {
                    if (err.code === 'ENOENT') {
                        mkdirp(_path);
                    } else {
                        cb(err);
                    }
                }

                var filePath = path.format({ dir: _path, name: key, ext: '.json' });
                fs.writeFile(filePath, value, function (err) {
                    if (err) {
                        cb(err);
                    } else {
                        if (keys.indexOf(key) === -1) {
                            keys.push(key);
                            length++;
                        }
                        cb(null);
                    }
                });
            });
        }

        function removeItem(key) { }

        function clear() { }
    }

    // NodeJS
    if (typeof exports !== 'undefined') {
        exports.JsonPersistentStorage = JsonPersistentStorage;
    }

})(exports);
