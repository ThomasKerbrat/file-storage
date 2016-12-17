const assert = require('chai').assert;
const fs = require('fs');
const path = require('path');

const rimraf = require('rimraf');
const mkdirp = require('mkdirp');

const Storage = require('../src/file-storage.js').FileStorage;

describe('JsonPersistentStorage', function () {
    const myPath = 'test/data/myPath';

    beforeEach(function () {
        rimraf.sync(path.join(path.dirname(myPath), '**/*'));
    });

    after(function () {
        rimraf.sync(path.join(path.dirname(myPath), '**/*'));
    });

    describe('constructor', function () {
        it('should throw an error when no params are given', function () {
            assert.throws(function () {
                storage = new Storage();
            }, TypeError, /Missing path argument/);
        });

        it('should not throw an error when a param is given', function () {
            assert.doesNotThrow(function () {
                storage = new Storage(myPath);
            }, TypeError, /Missing path argument/);
        });

        it('should instantiate a new JsonPersistentStorage object', function () {
            storage = new Storage(myPath);
            assert.instanceOf(storage, Storage);
        });

        it('should restore the cache (length and keys) from the given path');
    });

    describe('#length', function () {
        let storage;

        beforeEach(function () {
            storage = new Storage(myPath);
        });

        it('should be a number', function () {
            assert.isNumber(storage.length);
        });

        it('should be initialized to 0', function () {
            assert.strictEqual(storage.length, 0);
        });

        it('should be readonly', function () {
            storage.length = 1;
            assert.strictEqual(storage.length, 0);
        });
    });

    describe('#key()', function () {
        let storage;

        beforeEach(function (done) {
            storage = new Storage(myPath);
            storage.setItem('foo', 'bar', function (err) {
                assert.strictEqual(err, null);
                assert.strictEqual(storage.length, 1);
                done();
            });
        });

        it('should throw if first parameter is not a number', function () {
            assert.throws(function () {
                storage.key(null);
            }, TypeError, /index must be a number/);
        })

        it('should return a string for an inbound index', function () {
            const result = storage.key(0);
            assert.strictEqual(typeof result, 'string');
        });

        it('should return null for an index out of range', function () {
            const result = storage.key(1);
            assert.strictEqual(result, null);
            const result2 = storage.key(-1);
            assert.strictEqual(result2, null);
        });

        it('should return a key for the given index', function () {
            const result = storage.key(0);
            assert.strictEqual(result, 'foo');
        });

        it('should preserve order between two key() calls', function () {
            const firstKeyIndex = storage.key(0);
            const secondKeyIndex = storage.key(0);
            assert.strictEqual(firstKeyIndex, secondKeyIndex);
        });
    });

    describe('#getItem()', function () {
        let storage;

        beforeEach(function (done) {
            storage = new Storage(myPath);
            storage.setItem('foo', 'bar', function (err) {
                assert.strictEqual(err, null);
                assert.strictEqual(storage.length, 1);
                done();
            });
        });

        it('should throw if the callback parameter is provided but not a function', function () {
            assert.throws(function () {
                storage.getItem('foo', 'not a callback');
            }, Error, /cb must be a function/);
        });

        it('should not accept to get a non string key', function (done) {
            storage.getItem(123, function (err) {
                assert.notStrictEqual(err, null);
                assert.include(err.message, 'key must be a string');
                done();
            });
        });

        it('should not accept to get a key containing a separator', function (done) {
            storage.getItem(path.join('baz', 'foo'), function (err) {
                assert.notStrictEqual(err, null);
                assert.include(err.message, 'key must not contain a separator. Found at index');
                done();
            });
        });

        it('should do nothing if the key does not exist in the cache', function (done) {
            storage.getItem('nonExistentKey', function (err) {
                assert.strictEqual(err, null);
                done();
            });
        });

        it('should read the file at "myPath/key.json" for the given key', function (done) {
            storage.getItem('foo', function (err, value) {
                assert.strictEqual(err, null);
                assert.strictEqual(value, 'bar');
                done();
            });
        });
    });

    describe('#setItem()', function () {
        let storage;

        beforeEach(function () {
            storage = new Storage(myPath);
        });

        it('should throw if the callback parameter is provided but not a function', function () {
            assert.throws(function () {
                storage.setItem('foo', 'bar', 'not a callback');
            }, Error, /cb must be a function/);
        });

        it('should not accept to get a non string key', function (done) {
            storage.getItem(123, function (err) {
                assert.notStrictEqual(err, null);
                assert.include(err.message, 'key must be a string');
                done();
            });
        });

        it('should not accept to write a key containing a separator', function (done) {
            storage.setItem(path.join('baz', 'foo'), 'bar', function (err) {
                assert.notStrictEqual(err, null);
                assert.include(err.message, 'key must not contain a separator. Found at index');
                done();
            });
        });

        it('should write a file for the given key at "myPath/key.json"', function (done) {
            const fileName = 'foo';
            const filePath = path.format({ dir: myPath, name: fileName, ext: '.json' });

            storage.setItem(fileName, 'bar', function (err) {
                assert.strictEqual(err, null);
                fs.access(filePath, function (err) {
                    assert.strictEqual(err, null);
                    done();
                });
            });
        });

        it('should not write a file if the path is already taken by a directory', function (done) {
            mkdirp(path.join(myPath, 'foo.json'), function (err) {
                assert.strictEqual(err, null);
                storage.setItem('foo', 'bar', function (err) {
                    assert.notStrictEqual(err, null);
                    assert.strictEqual(err.code, 'EISDIR');
                    done();
                });
            });
        });

        it('should increase length when setting a new item', function (done) {
            assert.strictEqual(storage.length, 0);
            storage.setItem('foo', 'bar', function (err) {
                assert.strictEqual(err, null);
                assert.strictEqual(storage.length, 1);
                done();
            });
        });

        it('should not increase length for items already present', function (done) {
            storage.setItem('foo', 'bar', function (err) {
                assert.strictEqual(err, null);
                storage.setItem('foo', 'bar', function (err) {
                    assert.strictEqual(err, null);
                    assert.strictEqual(storage.length, 1);
                    done();
                });
            });
        });

        [
            ['undefined', undefined, 'undefined'],
            ['null', null, 'null'],
            ['number', 123, '123'],
            ['string', 'abc', 'abc'],
            ['function', logArgs, 'function logArgs() { console.log(arguments); }'],
            ['object', { a: 0 }, '[object Object]'],
            ['array', ['abc', 123, 'null', null], 'abc,123,null,']
        ].forEach((args) => itMustAcceptAnyValueToStore.apply(null, args));

        function itMustAcceptAnyValueToStore(valueType, value, expected) {
            return it(`should must accept ${ valueType } value to store`, function (done) {
                assert.strictEqual(storage.length, 0);
                storage.setItem('foo-' + valueType, value, function (err) {
                    assert.strictEqual(err, null);
                    assert.strictEqual(storage.length, 1);
                    storage.getItem('foo-' + valueType, function (err, value) {
                        assert.strictEqual(err, null);
                        assert.strictEqual(value, expected);
                        done();
                    });
                });
            });
        }

        function logArgs() { console.log(arguments); }
    });

    describe('#removeItem()', function () {
        let storage;

        beforeEach(function () {
            storage = new Storage(myPath);
        });

        it('should throw if the callback parameter is provided but not a function', function () {
            assert.throws(function () {
                storage.removeItem('foo', 'not a callback');
            }, Error, /cb must be a function/);
        });

        it('should not accept to get a non string key', function (done) {
            storage.getItem(123, function (err) {
                assert.notStrictEqual(err, null);
                assert.include(err.message, 'key must be a string');
                done();
            });
        });

        it('should not accept to remove a key containing a separator', function (done) {
            storage.removeItem(path.join('baz', 'foo'), function (err) {
                assert.notStrictEqual(err, null);
                assert.include(err.message, 'key must not contain a separator. Found at index');
                done();
            });
        });

        it('should do nothing if the key does not exist in the cache', function (done) {
            storage.removeItem('nonExistentKey', function (err) {
                assert.strictEqual(err, null);
                done();
            });
        });

        it('should decrease length when removing an item', function (done) {
            storage.setItem('foo', 'bar', function (err) {
                assert.strictEqual(err, null);
                assert.strictEqual(storage.length, 1);
                storage.removeItem('foo', function (err) {
                    assert.strictEqual(err, null);
                    assert.strictEqual(storage.length, 0);
                    done();
                });
            });
        });

        it('should delete (unlink) a file for the given key', function (done) {
            storage.setItem('foo', 'bar', function (err) {
                assert.strictEqual(err, null);
                storage.removeItem('foo', function (err) {
                    assert.strictEqual(err, null);
                    fs.access(path.format({ dir: myPath, name: 'foo', ext: '.json' }), function (err) {
                        assert.notStrictEqual(err, null);
                        assert.strictEqual(err.code, 'ENOENT');
                        done();
                    });
                })
            });
        });
    });

    describe('#clear()', function () {
        let storage;

        beforeEach(function (done) {
            storage = new Storage(myPath);
            storage.setItem('foo', 'bar', function (err) {
                assert.strictEqual(err, null);
                assert.strictEqual(storage.length, 1);
                done();
            });
        });

        it('should throw if the callback parameter is provided but not a function', function () {
            assert.throws(function () {
                storage.clear('foo', 'not a callback');
            }, Error, /cb must be a function/);
        });

        it('should reset to 0 when clearing', function (done) {
            storage.clear(function (err) {
                assert.strictEqual(err, null);
                assert.strictEqual(storage.length, 0);
                done();
            });
        });

        it('should remove all keys present in the cache', function (done) {
            // Callback 🔥H🔥E🔥L🔥L🔥
            storage.setItem('bar', 'baz', function (err) {
                assert.strictEqual(err, null);
                assert.strictEqual(storage.length, 2);
                storage.clear(function (err) {
                    assert.strictEqual(err, null);
                    assert.strictEqual(storage.length, 0);
                    fs.access(path.format({ dir: myPath, name: 'foo', ext: '.json' }), function (err) {
                        assert.notStrictEqual(err, null);
                        assert.strictEqual(err.code, 'ENOENT');
                        fs.access(path.format({ dir: myPath, name: 'bar', ext: '.json' }), function (err) {
                            assert.notStrictEqual(err, null);
                            assert.strictEqual(err.code, 'ENOENT');
                            done();
                        });
                    });
                });
            });
        });
    });
});
