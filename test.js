/**
 * Copyright (c) 2023 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const path = require('path');
const fs = require('fs');
const Cache = require('.');
const cache = new Cache({ dir: path.join(__dirname, 'cache') });


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
	cache.set(k,v)
	// compare original and parsed value
	console.log({in:v, out:cache.get(k).parse()});
}



let file = path.join(__dirname, './package.json');
// file = '/home/mugz/Videos/zoom_0.m4v'

let key = 'package.js';

// cache file for 30 seconds
cache.set(key, fs.readFileSync(file), 30);

// cache.touch(key, 39);

let buf = cache.get(key);
console.log(buf);

// cache string for
cache.set(key + '2', 7);
cache.set('key', '354', 30);

// cache.clear();
// cache.remove(key);
cache
	.getAll()
	.then((resp) => {
		console.log(resp);
	})
	.catch(console.error);

//
// let buf = cache.get(key);

// console.log(buf)
// console.log(buf && buf.toString());
