const assert = require('chai').assert;
const Storage = require('../src/json-persistent-storage.js').JsonPersistentStorage;

const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');

const cl = console.log;
function log(value) { console.log('**LOG**', value); return value; };

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

    });

    describe('#getItem()', function () {

    });

    describe('#setItem()', function () {
        let storage;

        beforeEach(function () {
            storage = new Storage(myPath);
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

        it('should not accept to write a key containing a separator', function (done) {
            storage.setItem(path.join('baz', 'foo'), 'bar', function (err) {
                assert.notStrictEqual(err, null);
                assert.include(err.message, 'key must not contain a separator. Found at index');
                done();
            });
        });

        it('should not write a file if the path is already taken by a directory', function (done) {
            rimraf(myPath, function (err) {
                assert.strictEqual(err, null);
                mkdirp(path.join(myPath, 'foo.json'), function (err) {
                    assert.strictEqual(err, null);
                    storage.setItem('foo', 'bar', function (err) {
                        assert.notStrictEqual(err, null);
                        assert.strictEqual(err.code, 'EISDIR');
                        done();
                    });
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

        it('should throw if the callback parameter is provided but not a function', function () {
            assert.throws(function () {
                storage.setItem('foo', 'bar', 'not a callback');
            }, Error, /cb must be a function/);
        });
    });

    describe('#removeItem()', function () {
        let storage;

        beforeEach(function () {
            storage = new Storage(myPath);
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

        it('should throw if the callback parameter is provided but not a function', function () {
            assert.throws(function () {
                storage.removeItem('foo', 'not a callback');
            }, Error, /cb must be a function/);
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
