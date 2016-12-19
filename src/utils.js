
/** @module */

var path = require('path');
var defaultOptions = require('./default-options.json');

/**
 * @summary Checks if the callback is provided.
 * @description If the callback is provided, it must be a function, otherwise default to noop.
 * @param {function} [callback] The callback to check.
 * @returns {function} Return the callback to use. It can be the given one or the noop.
 */
module.exports.checkCallBack = function checkCallBack(callback) {
    if (typeof callback === 'undefined') { return function () { }; }
    else if (typeof callback !== 'function') { throw new Error('cb must be a function'); }
    else { return callback; }
}

/**
 * @typedef KeyValidationResult
 * @property {boolean} isValid Is the key valid?
 * @property {string} message The error message in case the key is not valid.
 * @property {boolean} isPresent Is the key present in the cache?
 * @property {number} atIndex If the key is present, the index in the given keys array.
 */

/**
 * @summary Checks if the key is valid.
 * @description
 * This function checks if the provided key is valid.
 * For a key to be valid, it has to pass the following tests :
 * 
 * - Must be a `string`.
 * - Must not contain a separator, as defined by `path.sep`.
 * 
 * @see {@link https://nodejs.org/api/path.html#path_path_sep}
 * 
 * @param {string} key The key to check.
 * @param {string[]} [keys] All the keys in the cache. (optional)
 * @returns {module:utils~KeyValidationResult} A KeyValidationResult object with the result of the validation.
 */
module.exports.validateKey = function validateKey(key, keys) {
    /** @type {KeyValidationResult} */
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

    if (keys instanceof Array) {
        result.atIndex = keys.indexOf(key);
        result.isPresent = result.atIndex > -1;
    }

    return result;
}

/**
 * @summary Format the relative file path of a given file name.
 * @see {@link https://nodejs.org/api/path.html#path_path_format_pathobject}
 * @param {string} directory The directory (dir) path.
 * @param {string} fileName The file (name) path.
 * @param {string} extension The extention, including the dot (ext).
 * @returns {string} The formatted path for the given parameters.
 */
module.exports.buidFilePath = function buidFilePath(directory, fileName, extension) {
    return path.format({
        dir: directory,
        name: fileName,
        ext: extension,
    });
}

/**
 * @private
 * @summary Deep clone a value with JSON parse and stringify.
 * @param {any} obj The value to clone.
 * @return {any} The cloned value.
 */
function clone(obj) {
    if (typeof obj === 'undefined') { return; }
    return JSON.parse(JSON.stringify(obj));
}

/**
 * @summary Checks the option object and provide defaults value if necessary.
 * @param {module:file-storage~OptionsObject} rawOptions The user's options object to verify.
 * @throws {TypeError} If any provided value's type is not correct.
 * @returns {module:file-storage~OptionsObject} The validated options object with missing or invalid properties to their default values.
 */
module.exports.defaults = function defaults(rawOptions) {
    var options = Object.assign({}, defaultOptions, rawOptions);

    if (options.serialize !== null && typeof options.serialize !== 'function') {
        throw new TypeError('options.serialize must be a function');
    }

    if (options.deserialize !== null && typeof options.deserialize !== 'function') {
        throw new TypeError('options.deserialize must be a function');
    }

    return options;
}
