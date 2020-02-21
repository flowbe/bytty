/**
 * Sanitize a string by removing accents and spaces
 * @param {string} str - String to format
 * @return {string} Sanitized string
 */
export default function (str) {
	var map = {
		'-': /\s/g,
		'a': /[àáâãäå]/g,
		'e': /[èéêë]/g,
		'i': /[ìíîï]/g,
		'o': /[òóôõö]/g,
		'u': /[ùúûü]/g,
		'y': /[ýÿ]/g,
		'c': /ç/g,
		'n': /ñ/g,
		'ae': /æ/g,
		'oe': /œ/g,
		'': /[\W&&[^\- .]]/g
	}

	str = str.toLowerCase()

	for (var pattern in map) {
		str = str.replace(map[pattern], pattern)
	}

	return str
}