const assert = require('chai').assert;
const Storage = require('../src/json-persistent-storage.js').JsonPersistentStorage;

const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const cl = console.log;
function log(value) { console.log('**LOG**', value); return value; };

describe('JsonPersistentStorage', function () {
    let storage;
    const myPath = 'test/data/myPath';

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

            storage.setItem(fileName, 'bar', onSetItemDone);

            function onSetItemDone(err) {
                assert.strictEqual(err, null);
                fs.access(filePath, function (err) {
                    assert.strictEqual(err, null);
                    done();
                });
            }
        });

        // Try to write a file but the name is already aken by a directory.
        // Try to write a file into a subdir but the dir does not exist.

        it('should increase length when setting a new item', function (done) {
            storage.setItem('foo', 'bar', function (err) {
                assert.strictEqual(err, null);
                assert.strictEqual(storage.length, 1);
                done();
            });
        });

        it('should not increase length for items already present', function () {
            storage.setItem('foo', 'bar', function (err) {
                assert.strictEqual(err, null);
                storage.setItem('foo', 'bar', function (err) {
                    assert.strictEqual(err, null);
                    assert.strictEqual(storage.length, 1);
                });
            });
        });
    });

    describe('#removeItem()', function () {
        let storage;

        beforeEach(function () {
            storage = new Storage(myPath);
        });

        it('should decrease when removing an item', function () {
            storage.setItem('foo', 'bar');
            storage.removeItem('foo');
            assert.strictEqual(storage.length, 0);
        });
    });

    describe('#clear()', function () {
        let storage;

        beforeEach(function () {
            storage = new Storage(myPath);
        });

        it('should reset to 0 when clearing', function () {
            storage.setItem('foo', 'bar');
            assert.strictEqual(storage.length, 1);

            storage.clear();
            assert.strictEqual(storage.length, 0);
        });
    });
});
