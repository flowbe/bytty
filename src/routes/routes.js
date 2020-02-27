import express from 'express'
import csurf from 'csurf'
import multer from 'multer'
import bodyParser from 'body-parser'
import sanitize from '../utils/sanitize'
import { index, upload, localFiles, clean, auth, viewFiles, downloadFiles, downloadFile, jsonError } from '../controllers/controller'

const router = express.Router()

const storage = multer.diskStorage({
	destination: function (req, file, callback) {
		callback(null, './uploads');
	},
	filename: function (req, file, callback) {
		callback(null, sanitize(file.originalname) + '-' + Date.now());
	}
})
const fileUpload = multer({ storage: storage }).array('files[]')

const csrfProtection = csurf()
const urlencodedParser = bodyParser.urlencoded({ extended: false })

router.get('/', csrfProtection, index)
router.post('/upload', fileUpload, csrfProtection, upload, jsonError)
router.get('/clean', clean)
router.get('/files', localFiles)
router.get('/files/:id', csrfProtection, viewFiles)
router.post('/files/:id', urlencodedParser, csrfProtection, viewFiles)
router.get('/files/:id/auth', csrfProtection, auth)
router.post('/files/:id/download', urlencodedParser, csrfProtection, downloadFiles)
router.post('/files/:folderId/download/:fileId', urlencodedParser, csrfProtection, downloadFile)

export default router