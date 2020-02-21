import express from 'express'
import csurf from 'csurf'
import multer from 'multer'
import { index, upload, clean, viewFiles, downloadFiles, downloadFile, jsonError } from '../controllers/controller'

const router = express.Router()

const storage = multer.diskStorage({
	destination: function (req, file, callback) {
		callback(null, './uploads');
	},
	filename: function (req, file, callback) {
		callback(null, file.originalname + '-' + Date.now());
	}
})
const fileUpload = multer({ storage: storage }).array('files[]')

const csrfProtection = csurf()

router.get('/', csrfProtection, index)
router.post('/upload', fileUpload, csrfProtection, upload, jsonError)
router.get('/clean', clean)
router.get('/files/:id', viewFiles)
router.get('/files/:id/download', downloadFiles)
router.get('/files/:folderId/download/:fileId', downloadFile)

export default router