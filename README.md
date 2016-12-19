
# FileStorage : Storage

FileStorage is an abstraction for storing key/value pairs on the file system.
It uses the NodeJS `fs` module to persist the data.

It implements the [Storage](https://html.spec.whatwg.org/multipage/webstorage.html#the-storage-interface) interface.

## Getting started

FileStorage is intended to be used in NodeJS environment.
It abstracts the `fs` module API to a simpler one like the local and session storage.

The FileStorage API is comprised of `getItem()`, `setItem()`, `removeItem()`, `key()`, `clear()` and `length`.

``` javascript
const FileStorage = require('file-storage').FileStorage;
const storage = new FileStorage('path/to/data/directory');
```

In order to use the `FileStorage`, you will have to instantiate a new object.
The constructor takes the path to the directory in which to store the files.

``` javascript
const scientists = [
    { id: 1, firstName: 'Marie', lastName: 'Curie', birthDate: '1867-11-07' },
    { id: 2, firstName: 'Albert', lastName: 'Einstein', birthDate: '1879-03-14' },
];
storage.setItem('scientists', JSON.stringify(scientists));
```

Setting the `scientists` key will cause the `path/to/data/directory/scientists` file to be created
with the serialized array of employees.
The default encoding is UTF-8.
The files have no extension by default.

The library does not serialize the passed data in any format.
This is to let you choose which method to use to serialize your data.
As the data is stored as text, it is coerced to a string.
Thus, passing an object will store `[object Object]`.

``` javascript
storage.setItem('myObject', { pi: 3.14 }, function (err) {
    if (err) throw err;
    storage.getItem('myObject', function (err, data) {
        if (err) throw err;
        console.log(data); // "[object Object]"
    });
});
```

The `FileStorage` methods take an extra parameter which is a callback function.
This fits into the NodeJS API style.
The first argument of the callback function is the potential error.
For the `getItem()` method, the callback function takes the data as a second argument.

## Why FileStorage?

I wanted a software component that can read/write files in the file system.
Using the NodeJS `fs` module in the application code would have created a strong dependency to that particular technology.

In order to invert that dependency, the persistance layer must implement an interface from the application layer.
This is exactly what this library is all about.

Because the `FileStorage` implements the `Storage` interface,
the application code can rely on that implementation without tightly coupling itself.

See [Dependency inversion principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle).

## API

The online documentation is available at
[thomaskerbrat.github.io/file-storage](https://thomaskerbrat.github.io/file-storage/).

## Roadmap

In no particular order:

- Configure encoding.
- Configure extension for the saved files. (They currently have no extension, only the key itself.)
- Normalize the key before reading, writing or deleting the file.

# License

MIT

(Psss, you are just required to cite my name. That's all. Have fun :wink:)
