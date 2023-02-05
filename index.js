/**
 * Copyright (c) 2023 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

class Cache {
	constructor(opts) {
		if (is_object(opts) === false) {
			throw Error(`Opts argument must be an object`);
		}

		// some aliases to be compatible with other cache APIs
		this.put = this.get;
		this.remove = this.del;
		this.removeAll = this.clear;

		// make directory
		this.dir =
			opts.dir && typeof opts.dir == 'string'
				? path.resolve(opts.dir)
				: path.join(os.tmpdir(), 'ttl-file-cache');

		this.expiryStatus = {};

		//ensure dir
		if (!fs.existsSync(this.dir)) {
			fs.mkdirSync(this.dir, { recursive: true });
		}

		// initialize to load all expiry statuses
		this.#init();
	}

	async #init() {
		// get all
		this.getAll(true);
	}

	#from_hash(base64data) {
		try {
			if (!base64data) return null;

			let buff = new Buffer.from(base64data, 'base64');
			let jsonString = buff.toString('ascii');

			if (!jsonString) return null;

			let text = JSON.parse(jsonString);

			return text;
		} catch (error) {
			return null;
		}
	}

	#hash(input) {
		let buff = new Buffer.from(JSON.stringify(input));
		let base64data = buff.toString('base64');

		return base64data;
	}

	#expires(seconds = 0) {
		if (typeof seconds !== 'number')
			throw new Error('seconds must be a number');

		return seconds ? Math.floor(Date.now() / 1000) + seconds : 0;
	}

	#get_filePath(key) {
		let hash = this.#hash(key);
		return path.join(this.dir, hash + '.json');
	}

	async #watch_expiry(jsonBuff = null) {
		try {
			// add to status Object
			if (jsonBuff && jsonBuff.expires) {
				// console.log(jsonBuff);

				let d = new Date(jsonBuff.expires * 1000);
				// set key to the next hour after expires...
				let timeKey = this.#round_to_hr(d, 1).toString();

				this.expiryStatus[timeKey] = this.expiryStatus[timeKey] || [];

				if (this.expiryStatus[timeKey].indexOf(jsonBuff.key) == -1) {
					this.expiryStatus[timeKey].push(jsonBuff.key);
				}

				jsonBuff.timeKey = timeKey;
			}

			// console.log(new Date('2023-02-05T12:38:42.736Z'));

			let now = this.#round_to_hr();
			// now = this.#round_to_hr(new Date(), 1);

			let expiredKeys = this.expiryStatus[now] || [];

			if (expiredKeys.length) {
				delete this.expiryStatus[now];
				// remove all expired
				expiredKeys.forEach((key) => {
					this.del(key);
				});
			}
		} catch (error) {
			throw error;
		}
	}

	#round_to_hr(date = new Date(), skip = 0) {
		date = new Date(date);

		date.setHours(date.getHours() + skip);
		date.setMinutes(0, 0, 0); // Resets also seconds and milliseconds

		// console.log('d2', date);
		return date.toISOString();
	}

	#remove_from_expiry_status(jsonBuff) {
		if (
			this.expiryStatus[jsonBuff.timeKey] &&
			this.expiryStatus[jsonBuff.timeKey].length > 0
		) {
			var index = this.expiryStatus[jsonBuff.timeKey].indexOf(
				jsonBuff.key
			);
			if (index !== -1) {
				this.expiryStatus[jsonBuff.timeKey].splice(index, 1);
			}
		}
	}

	get(key, touchFile = false, updateStatus = false) {
		if (typeof key !== 'string')
			throw new Error('key argument must be a string');

		// watch expiry
		this.#watch_expiry().catch(console.error);

		let filePath = this.#get_filePath(key);

		if (!fs.existsSync(filePath)) return null;

		let jsonBuff = JSON.parse(fs.readFileSync(filePath));

		//

		if (jsonBuff == null || 'expires' in jsonBuff === false) {
			return null;
		}

		//now unix timestamp
		let now = Math.floor(Date.now() / 1000);

		// check that file has not expired
		if (jsonBuff.expires == 0 || jsonBuff.expires > now) {
			let buf = Buffer.from(jsonBuff);

			buf.dataType = jsonBuff.dataType;
			buf.key = jsonBuff.key;
			buf.ttl = jsonBuff.ttl;
			buf.expires = jsonBuff.expires;

			//if we are asked to touch file
			// then we should extend expires by ttl
			if (touchFile) {
				this.touch(key);
			}

			// if we want to update status for all files
			if (updateStatus) {
				this.#watch_expiry(jsonBuff).catch(console.error);
			}

			return buf;
		}

		// delete file
		fs.unlinkSync(filePath);

		return null;
	}

	getAll(updateStatus = false) {
		let keys = fs
			.readdirSync(this.dir)
			.map((f) => {
				let hash = f.replace(/\.json$/, '');
				let key = this.#from_hash(hash);
				return key;
			})
			.filter((key) => key && key.length > 0);

		return keys
			.map((key) => {
				return this.get(key, false, updateStatus);
			})
			.filter((buf) => Buffer.isBuffer(buf));
	}

	set(key, data, ttl = 0) {
		// validate inputs
		if (typeof key !== 'string')
			throw new Error('key argument must be a string');

		if (!data && !Buffer.isBuffer(data))
			throw new Error('data argument must be a value or buffer');

		if (typeof ttl !== 'number')
			throw new Error('ttl argument must be a number');

		let filePath = this.#get_filePath(key);
		let dataBuff, typeOf;

		if (Buffer.isBuffer(data)) {
			dataBuff = data;
			typeOf = 'buffer';
		} else if ('string' == typeof data) {
			dataBuff = Buffer.from(data);
			typeOf = 'string';
		} else {
			typeOf = typeof data;
			dataBuff = Buffer.from(JSON.stringify(data));
		}

		// convert buffer to JSON
		let jsonBuff = dataBuff.toJSON();
		// add Expires value
		jsonBuff.expires = this.#expires(ttl);
		jsonBuff.ttl = ttl;
		jsonBuff.dataType = typeOf;
		jsonBuff.key = key;

		// watch expiry
		this.#watch_expiry(jsonBuff).catch(console.error);

		// save file
		fs.writeFileSync(filePath, JSON.stringify(jsonBuff));
	}

	touch(key, ttl = 0) {
		// validate inputs
		if (typeof key !== 'string')
			throw new Error('key argument must be a string');

		if (typeof ttl !== 'number')
			throw new Error('ttl argument must be a number');

		let filePath = this.#get_filePath(key);

		// stop here if no file
		if (!fs.existsSync(filePath)) return null;

		let jsonBuff = JSON.parse(fs.readFileSync(filePath));

		//now unix timestamp
		let now = Math.floor(Date.now() / 1000);

		// use new ttl or use the original ttl used to save file
		ttl = ttl || jsonBuff.ttl;

		// if ttl is zero, then file lives forever, stop here
		if (ttl == 0) return null;

		//check if file is about to expire or has expired
		let expiresAfter = jsonBuff.expires - now;

		if (expiresAfter < ttl) {
			// add expires by the number of ttl seconds
			jsonBuff.expires = now + ttl;
			jsonBuff.ttl = ttl;

			// re-save file
			fs.writeFileSync(filePath, JSON.stringify(jsonBuff));

			// remove this key from expiry key from status object
			// a new key will be created by #watch_expiry and placed wherever the touch() event resolves to
			this.#remove_from_expiry_status(jsonBuff);

			// console.log(this.expiryStatus);
			// watch expiry
			this.#watch_expiry(jsonBuff).catch(console.error);

			// console.log(this.expiryStatus);
		}

		return { expiresAfter, expiresAt: jsonBuff.expires };
	}

	clear() {
		// get all files in dir
		fs.readdirSync(this.dir)
			.map((f) => {
				let hash = f.replace(/\.json$/, '');
				let key = this.#from_hash(hash);
				return key;
			})
			.filter((key) => key && key.length > 0)
			.map((key) => {
				this.del(key);
			});
	}

	del(key) {
		if (typeof key !== 'string')
			throw new Error('key argument must be a string');

		let filePath = this.#get_filePath(key);

		// stop here if no file
		if (!fs.existsSync(filePath)) return null;

		let jsonBuff = JSON.parse(fs.readFileSync(filePath));

		// console.log(jsonBuff);
		// remove this key from expiry key from status object
		// a new key will be created by #watch_expiry and placed wherever the touch() event resolves to
		this.#remove_from_expiry_status(jsonBuff);

		// delete file
		fs.existsSync(filePath) && fs.unlinkSync(filePath);
	}
}

function is_object(value) {
	if (!value) return false;
	return value.toString() === '[object Object]';
}

module.exports = Cache;