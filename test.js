/**
 * Copyright (c) 2023 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */


const path = require('path');
const fs = require('fs');
const Cache = require('.');
const cache = new Cache({dir:path.join(__dirname,'cache')});

let file = path.join(__dirname, './package.json');
// file = '/home/mugz/Videos/zoom_0.m4v'

let key = 'package.js';

// cache file for 30 seconds
cache.set(key, fs.readFileSync(file), 30);

cache.touch(key, 36789);

let buf = cache.get(key);
console.log(buf && buf.toString())


// cache string for 
cache.set(key+'2', 7)
cache.set('key', '354', 30)

// cache.clear();
// cache.remove(key);
let buffs = cache.getAll();
console.log(buffs);

// 
// let buf = cache.get(key);

// console.log(buf)
// console.log(buf && buf.toString());
