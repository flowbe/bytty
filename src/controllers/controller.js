import fs from 'fs'
import path from 'path'
import shortid from 'shortid'
import AdmZip from 'adm-zip'
import Folder from '../models/folder'
import File from '../models/file'
import sequelize from '../utils/sequelize'
import config from '../../config.json'

export function index(req, res) {
	res.render('index', { csrfToken: req.csrfToken() })
}

export async function upload(req, res) {
	// Save to database
	const id = shortid.generate()
	const expirationDate = new Date()
	expirationDate.setDate(expirationDate.getDate() + 1)

	try {
		const result = await sequelize.transaction(async t => {
			const folder = await Folder.create({ id: id, expirationDate: expirationDate }, { transaction: t })
			for (const file of req.files) {
				const f = await File.create({ originalName: file.originalname, fileName: file.filename }, { transaction: t })
				await f.setFolder(folder, { transaction: t })
			}
		})

		res.end(JSON.stringify({ success: true, link: `${config.HOST}/files/${id}` }))
	} catch (err) {
		console.error(err)
		res.status(500).end(JSON.stringify({ success: false, error: err.message }))
	}
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

	res.end()
}

export async function viewFiles(req, res, next) {
	const id = req.params.id

	// Does the parameter passed looks like a valid id?
	if (shortid.isValid(id)) {
		try {
			const folder = await Folder.findOne({ where: { id: id }, include: [{ model: File }] })
			if (folder) {
				res.render('files', { id: folder.id, files: folder.files })
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
			const folder = await Folder.findOne({ where: { id: id }, include: [{ model: File }] })
			if (folder) {
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
			const file = await File.findOne({ where: { id: fileId }, include: [{ model: Folder, where: { id: folderId } }] })
			if (file) {
				res.download(path.join('uploads', file.fileName), file.originalName)
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