const crypto = require('crypto')

/**
 * Generates random string of characters i.e salt
 * @return {string} Random string
 */
exports.generateSalt = () => {
	let salt = crypto.randomBytes(16).toString('hex')

	return salt
}

/**
 * Creates password hash using Password-Based Key Derivation Function 2
 * @param {string} password - Password to hash
 * @param {string} salt - Password salt
 * @return {string} Hashed password
 */
exports.hashPassword = (password, salt) => {
	let hash = crypto.pbkdf2Sync(password, salt, 2048, 32, 'sha512').toString('hex')

	return hash
}

/**
 * Checks the password hash
 * @param {string} hashedPassword - Password hash
 * @param {string} salt - Password salt
 * @param {string} password - Plain text password
 * @return {boolean} Boolean indicating whether `password` corresponds to `hashedPassword`
 */
exports.verifyHash = (hashedPassword, salt, password) => {
	let hash = crypto.pbkdf2Sync(password, salt, 2048, 32, 'sha512').toString('hex')

	return hash === hashedPassword
}
