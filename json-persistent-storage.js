(function () {

    var JsonPersistentStorage = {};

    // NodeJS
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = JsonPersistentStorage;
        }
        exports.JsonPersistentStorage = JsonPersistentStorage;
    }

})();
