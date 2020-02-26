import express from 'express'
import csurf from 'csurf'
import { index } from '../controllers/pastebin'

const router = express.Router()

const csrfProtection = csurf()

router.get('/', csrfProtection, index)
//router.post('/upload', csrfProtection, upload, jsonError)
//router.get('/clean', clean)
//router.get('/files/:id', viewFiles)
//router.get('/files/:id/download', downloadFiles)
//router.get('/files/:folderId/download/:fileId', downloadFile)

export default router