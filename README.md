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
<Buffer 7b 0a 09 22 6e 61 6d 65 22 3a 20 22 74 74 6c 2d 66 69 6c 65 2d 63 61 63 68 65 22 2c 0a 09 22 76 65 72 73 69 6f 6e 22 3a 20 22 31 2e 30 2e 30 22 2c 0a ... 188 more bytes, dataType: 'buffer', key: 'package.js', ttl: 30, expires: 1675600657>
```

The `get(key)` method returns a buffer with the following properties added:

-   `key` the original key used to get the cache data
-   `dataType` indicates the type of data originally saved into the cache. In this case, we saved a buffer.
-   `ttl` and `expires` shows how long the file is stored on disk and when it will be deleted respectively.

## API

### **`set(key, data, [ttl])`**
Saves a cache key by writing the data into disk.

The `data` argument can be a `buffer`, `string`, `number` or even `object`.

The `ttl` is the `number` of seconds that the item is cached. If omitted, a default of zero (0) is used, which translates to _NO EXPIRY_.

### **`get(key,[touchFile, updateStatus])`**
Fetches a cached item. Returns `null` if that key does not exist or item has expired.

### **`getAll()`**
Gets and returns an array of all items cached. This method could be very expensive where the items are numerous so you should use it carefully and probably within an async block.

`touchFile` allows you to simultaneously **"touch a cache item"** thereby increasing its **ttl** while accessing it. This argument is great when you intend to keep files in cache while they are still being accessed. Note that the ttl (time to live) is extended by the same value that was entered while caching the file/key.

### **`del(key)`**
Deletes a cache item by deleting the files from disk.

### **`remove(key)`**
Alias of `del(key)`.

### **`clear()`**
Deletes all cache items.

### **`removeAll()`**
Alias of `clear()`.

### **`touch(key, [ttl])`**
This method **"touches a cache item"** and thereby extends its expiry. If no `ttl` is entered, then the expiry is extended by the original ttl entered while caching the item via the `set()` method.