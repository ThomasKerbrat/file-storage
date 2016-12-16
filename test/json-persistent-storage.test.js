const assert = require('chai').assert;
const JsonPersistentStorage = require('../src/json-persistent-storage.js').JsonPersistentStorage;

describe('JsonPersistentStorage', () => {
    describe('#length', () => {
        let storage;

        beforeEach(() => {
            storage = new JsonPersistentStorage();
        });

        it('should be a number', () => {
            assert.isNumber(storage.length);
        });

        it('should be initialized to 0', () => {
            assert.strictEqual(storage.length, 0);
        });

        it('should be readonly', () => {
            storage.length = 1;
            assert.strictEqual(storage.length, 0);
        });
    });

    describe('#key()', () => {

    });

    describe('#getItem()', () => {

    });

    describe('#setItem()', () => {
        let storage;

        beforeEach(() => {
            storage = new JsonPersistentStorage();
        });

        it('should increase when setting a new item', () => {
            storage.setItem('foo', 'bar');
            assert.strictEqual(storage.length, 1);
        });

        it('should not increase for items already present', () => {
            storage.setItem('foo', 'bar');
            storage.setItem('foo', 'bar');
            assert.strictEqual(storage.length, 1);
        });
    });

    describe('#removeItem()', () => {
        let storage;

        beforeEach(() => {
            storage = new JsonPersistentStorage();
        });

        it('should decrease when removing an item', () => {
            storage.setItem('foo', 'bar');
            storage.removeitem('foo');
            assert.strictEqual(storage.length, 0);
        });
    });

    describe('#clear()', () => {
        let storage;

        beforeEach(() => {
            storage = new JsonPersistentStorage();
        });

        it('should reset to 0 when clearing', () => {
            storage.setItem('foo', 'bar');
            assert.strictEqual(storage.length, 1);

            storage.clear();
            assert.strictEqual(storage.length, 0);
        });
    });
});
