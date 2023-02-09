# ttl-file-cache

A cache module that writes cached items into disk and manages automatic pruning of expired items.

Expired items are immediately pruned whenever encountered. But also, the module is built to save on disk resources as much as possible. Therefore, it stores a map of all files/keys expiring every hour and will prune them all as soon as they expire. Pruning causes all cache files that have expired to be deleted from disk.

```javascript
// initialize
const Cache = require('ttl-file-cache');
const cache = new Cache({ dir: 'YOUR/CACHE/DIR' }); //default dir is '/tmp/ttl-file-cache' or whatever os.tempdir() resolves to on your operating system

// cache file content for 30 seconds
let file = path.join(__dirname, './package.json');
let key = 'package.js';
cache.set(key, fs.readFileSync(file), 30);

// get cache
let buf = cache.get(key); // returns a buffer with extra properties
console.log(buf); // you can use buf.toString() to view the file content as a string
```

This will log:

```text
<Buffer 7b 0a 09 22 6e 61 6d 65 22 3a 20 ... 188 more bytes, dataType: 'buffer', key: 'package.js', ttl: 30, expires: 1675600657, parse: [Function: bound #parse]>
```

The `get(key)` method returns a buffer with the following properties added to the buffer response: `key`, `dataType`, `ttl` , `expires`, `parse`.

## API

### **`new Cache({dir,ttl})`**

Creates a new instance of the cache.

**`dir`** sets the directory to be used for saving cache files. Defaults to `/tmp/ttl-file-cache`. Where `/tmp/` directory is based on [os.tmpdir()](https://nodejs.org/api/os.html#ostmpdir)

**`ttl`** sets the default cache time to live used by `set()` and `touch()` methods. Default is zero (0) or no expiry.

### **`set(key, data, [ttl])`**

Saves a cache key by writing the data into disk.

The `data` argument can be a `buffer`, `string`, `number` or even `object`.

The `ttl` is the `number` of seconds that the item is cached. If omitted, a default of zero (0) is used, which translates to _NO EXPIRY_.

### **`get(key,[touchFile, updateStatus])`**

Fetches a cached item. Returns `null` if that key does not exist or item has expired.

#### **`get(key).parse()` and other response props**

The buffer returned by `get()` method as several convenient properties added to it. These are:

-   `.dataType` : indicates the original datatype of the value stored.
-   `.key` : name of the cache item key
-   `.ttl` : the original ttl entered at time of caching the item or that updated using `touch(key)`
-   `.expires` : shows when cache item is expected to expire, save for it being `touched` using `touch` and this time updated.
-   .`parse()` : a convenient method to return the response buffer to its original datatype.

The code below demonstrates the use of `.parse()`

```javascript
// let us start with an array with different types of data
let dataTypes = [
	1000,
	true,
	'string',
	Buffer.from('buffer'),
	{ this: 'is an object' },
	[1, 2, 3, 4, 'a'],
];

for (let i in dataTypes) {
	// make cache key
	let k = `k:${i}`;
	// get array value
	let v = dataTypes[i];
	// save data and key
	cache.set(k, v);
	// compare original and parsed value
	console.log({ in: v, out: cache.get(k).parse() });
}
```

This will output the following properly parsed data.

```javascript
{ in: 1000, out: 1000 }
{ in: true, out: true }
{ in: 'string', out: 'string' }
{ in: <Buffer 62 75 66 66>, out: <Buffer 62 75 66 66> }
{ in: { this: 'is an object' }, out: { this: 'is an object' } }
{ in: [ 1, 2, 3, 4, 'a' ], out: [ 1, 2, 3, 4, 'a' ] }
```

### **`getAll()`**

Gets and returns an array of all items cached. This method could be very expensive where the items are numerous so you should use it carefully and probably within an async block.

**NOTE**: This method is asynchronous.

`touchFile` allows you to simultaneously **"touch a cache item"** thereby increasing its **ttl** while accessing it. This argument is great when you intend to keep files in cache while they are still being accessed. Note that the ttl (time to live) is extended by the same value that was entered while caching the file/key.

### **`del(key)`**

Deletes a cache item by deleting the files from disk.

### **`remove(key)`**

Alias of `del(key)`.

### **`clear()`**

Deletes all cache items.

**NOTE**: This method is asynchronous.

### **`removeAll()`**

Alias of `clear()`.

### **`touch(key, [ttl])`**

This method **"touches a cache item"** and thereby extends its expiry. If no `ttl` is entered, then the expiry is extended by the original ttl entered while caching the item via the `set()` method.

**NOTE:** One difference between doing `touch("myKey", 30)` and `get("myKey",true)` is that `touch()` will update the `'myKey'` `ttl` to 30 seconds irrespective.

However, `get()` with `touchFile` argument set to true will only update `ttl` to the original value whenever the item nears or has expired.
