/**
 * Copyright (c) 2023 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const { promisify } = require('util');
const { resolve } = require('path');
const fs = require('fs');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

async function getFiles(dir) {
  const subdirs = await readdir(dir);
  const files = await Promise.all(subdirs.map(async (subdir) => {
    const res = resolve(dir, subdir);
    return (await stat(res)).isDirectory() ? getFiles(res) : res;
  }));
  return files.reduce((a, f) => a.concat(f), []);
}

function encode(buffer) {
	return buffer
		.toString('base64')
		.replace(/\+/g, '-') // Convert '+' to '-'
		.replace(/\//g, '_') // Convert '/' to '_'
		.replace(/=+$/, ''); // Remove ending '='
}

function decode(base64) {
	// Add removed at end '='
	base64 += Array(5 - (base64.length % 4)).join('=');

	base64 = base64
		.replace(/\-/g, '+') // Convert '-' to '+'
		.replace(/\_/g, '/'); // Convert '_' to '/'

	return new Buffer.from(base64, 'base64');
}

module.exports = { encode, decode, getFiles };
