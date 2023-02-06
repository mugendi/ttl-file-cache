/**
 * Copyright (c) 2023 Anthony Mugendi
 * 
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */



const seedrandom = require("seedrandom");

/**
 * Contains static weighted chooser functions.
 */
class Chooser {
	/**
	 * Choose an index based on the weights provided in the number array. Higher weights increase likeliness of being chosen.
	 * Returns the chosen index, or `-1` if the array was empty or all weights were `0`.
	 *
	 * Only the first argument is required.
	 *
	 * Allows an optional random seed and default weight to use if array values are not numbers.
	 *
	 * All negative weights are converted to their absolute value.
	 *
	 * @param weights Weights as an array of numbers.
	 * @param seed Optional. Seed used for pseudorandom number generator (PRNG). Defaults to `Math.random()`.
	 * @param defaultWeight Optional. Default weight to use if one of the values is not a number. Defaults to `1`.
	 *
	 * @returns The chosen index as a number, or `-1` if the array was empty or all weights were `0`.
	 */
	chooseWeightedIndex = function (weights, seed, defaultWeight) {
		if (seed === void 0) {
			seed = Math.random();
		}
		if (defaultWeight === void 0) {
			defaultWeight = 1;
		}
		// If the array is falsy, not an array, or empty, return -1.
		if (!weights || !Array.isArray(weights) || weights.length <= 0) {
			return -1;
		}
		// Keep it positive.
		defaultWeight = Math.abs(defaultWeight);
		var cumulative = 0;
		// Add all weights to cumulative, and build an array of each cumulative value.
		// For example, if the weights are [5, 30, 10], this would build an array
		// containing [5, 35, 45], and cumulative=45.
		var ranges = weights.map(function (weight) {
			return (cumulative +=
				typeof weight === 'number' && weight >= 0
					? Math.abs(weight)
					: defaultWeight);
		});
		// Get our PRNG function using the seed.
		var seededRandFunc = new seedrandom(seed);
		// Select our value.
		var selectedValue = seededRandFunc() * cumulative;
		// If the selected value is within one of the ranges, that's our choice!
		for (var index = 0; index < ranges.length; index++) {
			if (selectedValue < ranges[index]) {
				return index;
			}
		}
		// If nothing was chosen, all weights were 0 or something went wrong.
		return -1;
	};
	
}


module.exports =  Chooser;
