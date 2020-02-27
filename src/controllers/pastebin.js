import shortid from 'shortid'
import { Op } from 'sequelize'
import Pastebin from '../models/pastebin'
import { generateSalt, hashPassword, verifyHash } from '../utils/password'
import config from '../../config.json'

export function index(req, res) {
	res.render('pastebin', { csrfToken: req.csrfToken() })
}

export async function upload(req, res) {
	if (req.body.pastebin && req.body.pastebin != '') {
		// Save to database
		const id = shortid.generate()
		const duration = (req.body.duration == '3d') ? 3 : ((req.body.duration == '2d') ? 2 : 1)
		const expirationDate = new Date()
		expirationDate.setDate(expirationDate.getDate() + duration)

		var parameters = { id: id, content: req.body.pastebin, expirationDate: expirationDate }

		if (req.body.password != '') {
			parameters.salt = generateSalt()
			parameters.password = hashPassword(req.body.password, parameters.salt)
		}

		try {
			await Pastebin.create(parameters)

			var localPastebin = []
			if (typeof req.signedCookies.pastebin !== 'undefined') {
				localPastebin = JSON.parse(req.signedCookies.pastebin)
			}
			localPastebin.push(id)

			res.cookie('pastebin', JSON.stringify(localPastebin), { signed: true }).end(JSON.stringify({ success: true, link: `${config.HOST}/pastebin/${id}` }))
		} catch (err) {
			console.error(err)
			res.status(500).end(JSON.stringify({ success: false, error: err.message }))
		}
	} else {
		res.redirect('/pastebin')
	}
}

export async function auth(req, res, next) {
	const id = req.params.id

	// Does the parameter passed looks like a valid id?
	if (shortid.isValid(id)) {
		try {
			const pastebin = await Pastebin.findOne({ where: { id: id, expirationDate: { [Op.gte]: new Date() } } })
			if (pastebin) {
				if (pastebin.password) {
					res.render('pastebin-auth', { id: id, csrfToken: req.csrfToken() })
				} else {
					res.redirect(`/pastebin/${pastebin.id}`)
				}
			} else {
				const err = new Error('The requested pastebin don\'t exist')
				next(err)
			}
		} catch (err) {
			next(err)
		}
	} else {
		const err = new Error('The requested pastebin don\'t exist')
		next(err)
	}
}

export async function viewPastebin(req, res, next) {
	const id = req.params.id

	// Does the parameter passed looks like a valid id?
	if (shortid.isValid(id)) {
		try {
			const pastebin = await Pastebin.findOne({ where: { id: id, expirationDate: { [Op.gte]: new Date() } } })
			if (pastebin) {
				if (pastebin.password) {
					// Ask for password
					if (req.method == 'POST' && req.body.password) {
						if (verifyHash(pastebin.password, pastebin.salt, req.body.password)) {
							res.render('viewPastebin', { pastebin: pastebin, csrfToken: req.csrfToken(), password: req.body.password })
						} else {
							req.flash('error', 'Wrong password!');
							res.redirect(`/pastebin/${id}/auth`)
						}
					} else {
						res.redirect(`/pastebin/${id}/auth`)
					}
				} else {
					res.render('viewPastebin', { pastebin: pastebin, csrfToken: req.csrfToken() })
				}
			} else {
				const err = new Error('The requested pastebin don\'t exist')
				next(err)
			}
		} catch (err) {
			next(err)
		}
	} else {
		const err = new Error('The requested pastebin don\'t exist')
		next(err)
	}
}

export async function rawPastebin(req, res, next) {
	const id = req.params.id

	// Does the parameter passed looks like a valid id?
	if (shortid.isValid(id)) {
		try {
			const pastebin = await Pastebin.findOne({ where: { id: id, expirationDate: { [Op.gte]: new Date() } } })
			if (pastebin) {
				if (pastebin.password) {
					// Ask for password
					if (req.method == 'POST' && req.body.password) {
						if (verifyHash(pastebin.password, pastebin.salt, req.body.password)) {
							res.end(pastebin.content)
						} else {
							req.flash('error', 'Wrong password!');
							res.redirect(`/pastebin/${id}/auth`)
						}
					} else {
						res.redirect(`/pastebin/${id}/auth`)
					}
				} else {
					res.end(pastebin.content)
				}
			} else {
				const err = new Error('The requested pastebin don\'t exist')
				next(err)
			}
		} catch (err) {
			next(err)
		}
	} else {
		const err = new Error('The requested pastebin don\'t exist')
		next(err)
	}
}