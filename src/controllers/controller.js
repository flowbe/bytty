import fs from 'fs'
import path from 'path'
import shortid from 'shortid'
import AdmZip from 'adm-zip'
import { Op } from 'sequelize'
import Folder from '../models/folder'
import File from '../models/file'
import Pastebin from '../models/pastebin'
import sequelize from '../utils/sequelize'
import config from '../../config.json'
import { generateSalt, hashPassword, verifyHash } from '../utils/password'

export function index(req, res) {
	res.render('index', { csrfToken: req.csrfToken() })
}

export async function upload(req, res) {
	// Save to database
	const id = shortid.generate()
	const duration = (req.body.duration == '3d') ? 3 : ((req.body.duration == '2d') ? 2 : 1)
	const expirationDate = new Date()
	expirationDate.setDate(expirationDate.getDate() + duration)

	var parameters = { id: id, expirationDate: expirationDate }

	if (req.body.password != '') {
		parameters.salt = generateSalt()
		parameters.password = hashPassword(req.body.password, parameters.salt)
	}

	try {
		const result = await sequelize.transaction(async t => {
			const folder = await Folder.create(parameters, { transaction: t })
			for (const file of req.files) {
				const f = await File.create({ originalName: file.originalname, fileName: file.filename }, { transaction: t })
				await f.setFolder(folder, { transaction: t })
			}
		})

		var localFiles = []
		if (typeof req.signedCookies.files !== 'undefined') {
			localFiles = JSON.parse(req.signedCookies.files)
		}
		localFiles.push(id)

		res.cookie('files', JSON.stringify(localFiles), { signed: true }).end(JSON.stringify({ success: true, link: `${config.HOST}/files/${id}` }))
	} catch (err) {
		console.error(err)
		res.status(500).end(JSON.stringify({ success: false, error: err.message }))
	}
}

export async function localFiles(req, res) {
	var localFiles = []
	if (typeof req.signedCookies.files !== 'undefined') {
		localFiles = JSON.parse(req.signedCookies.files)
	}

	var localPastebin = []
	if (typeof req.signedCookies.pastebin !== 'undefined') {
		localPastebin = JSON.parse(req.signedCookies.pastebin)
	}

	var files = []
	for (const fileID of localFiles) {
		const file = await Folder.findOne({ where: { id: fileID, expirationDate: { [Op.gte]: new Date() } } })
		if (file) {
			file.link = `${config.HOST}/files/${file.id}`
			files.push(file)
		}
	}

	var pastebins = []
	for (const pastebinID of localPastebin) {
		const pastebin = await Pastebin.findOne({ where: { id: pastebinID, expirationDate: { [Op.gte]: new Date() } } })
		if (pastebin) {
			pastebin.link = `${config.HOST}/pastebin/${pastebin.id}`
			pastebins.push(pastebin)
		}
	}

	res.render('localFiles', { files: files, pastebins: pastebins })
}

export async function clean(req, res) {
	const folders = await Folder.findAll({ include: [{ model: File }] })

	for (const folder of folders) {
		if (folder.expirationDate < Date.now()) {
			for (const file of folder.files) {
				try {
					await new Promise((resolve, reject) => {
						fs.unlink(path.join('uploads', file.fileName), err => {
							if (err) {
								reject(err)
							} else {
								resolve()
							}
						})
					})
				} catch (err) {
					console.error(err)
				}
			}
			await folder.destroy()
		}
	}

	await Pastebin.destroy({ where : { expirationDate: { [Op.lt]: new Date() } } })

	res.end()
}

export async function auth(req, res, next) {
	const id = req.params.id

	// Does the parameter passed looks like a valid id?
	if (shortid.isValid(id)) {
		try {
			const folder = await Folder.findOne({ where: { id: id, expirationDate: { [Op.gte]: new Date() } }, include: [{ model: File }] })
			if (folder) {
				if (folder.password) {
					res.render('auth', { id: id, csrfToken: req.csrfToken() })
				} else {
					res.redirect(`/files/${folder.id}`)
				}
			} else {
				const err = new Error('The requested files don\'t exist')
				next(err)
			}
		} catch (err) {
			next(err)
		}
	} else {
		const err = new Error('The requested files don\'t exist')
		next(err)
	}
}

export async function viewFiles(req, res, next) {
	const id = req.params.id

	// Does the parameter passed looks like a valid id?
	if (shortid.isValid(id)) {
		try {
			const folder = await Folder.findOne({ where: { id: id, expirationDate: { [Op.gte]: new Date() } }, include: [{ model: File }] })
			if (folder) {
				if (folder.password) {
					// Ask for password
					if (req.method == 'POST' && req.body.password) {
						if (verifyHash(folder.password, folder.salt, req.body.password)) {
							res.render('files', { id: folder.id, files: folder.files, csrfToken: req.csrfToken(), password: req.body.password })
						} else {
							req.flash('error', 'Wrong password!');
							res.redirect(`/files/${id}/auth`)
						}
					} else {
						res.redirect(`/files/${id}/auth`)
					}
				} else {
					res.render('files', { id: folder.id, files: folder.files, csrfToken: req.csrfToken() })
				}
			} else {
				const err = new Error('The requested files don\'t exist')
				next(err)
			}
		} catch (err) {
			next(err)
		}
	} else {
		const err = new Error('The requested files don\'t exist')
		next(err)
	}
}

export async function downloadFiles(req, res) {
	const id = req.params.id

	// Does the parameter passed looks like a valid id?
	if (shortid.isValid(id)) {
		try {
			const folder = await Folder.findOne({ where: { id: id, expirationDate: { [Op.gte]: new Date() } }, include: [{ model: File }] })
			if (folder) {
				if (!folder.password || (req.body.password && verifyHash(folder.password, folder.salt, req.body.password))) {
					const zip = new AdmZip()
					const zipPath = path.join('uploads', Date.now() + '.zip')
					folder.files.forEach(file => zip.addLocalFile(path.join('uploads', file.fileName), '', file.originalName))
					zip.writeZip(zipPath, err => {
						if (err) {
							next(err)
						} else {
							res.download(zipPath, 'files.zip', err => {
								fs.unlink(zipPath, err => {
									if (err) {
										console.error(err)
									}
								})
							})
						}
					})
				} else {
					res.redirect(`/files/${id}`)
				}
			} else {
				const err = new Error('The requested files don\'t exist')
				next(err)
			}
		} catch (err) {
			next(err)
		}
	} else {
		const err = new Error('The requested files don\'t exist')
		next(err)
	}
}

export async function downloadFile(req, res) {
	const folderId = req.params.folderId
	const fileId = req.params.fileId

	if (shortid.isValid(folderId) && fileId != undefined) {
		try {
			const file = await File.findOne({ where: { id: fileId }, include: [{ model: Folder, where: { id: folderId, expirationDate: { [Op.gte]: new Date() } } }] })
			if (file) {
				if (!file.folder.password || (req.body.password && verifyHash(file.folder.password, file.folder.salt, req.body.password))) {
					res.download(path.join('uploads', file.fileName), file.originalName)
				} else {
					res.redirect(`/files/${folderId}`)
				}
			} else {
				const err = new Error('The requested file doesn\'t exist')
				next(err)
			}
		} catch (err) {
			next(err)
		}
	} else {
		const err = new Error('The requested file doesn\'t exist')
		next(err)
	}
}

export function jsonError(err, req, res, next) {
	console.error(err)
	// Remove files
	for (const file of req.files) {
		fs.unlink(file.path, err => {
			if (err) {
				console.error(err)
			}
		})
	}
	res.status(500).end(JSON.stringify({ success: false, error: err.message }))
}