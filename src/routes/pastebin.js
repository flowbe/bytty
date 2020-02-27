import express from 'express'
import csurf from 'csurf'
import bodyParser from 'body-parser'
import { index, upload, auth, viewPastebin, rawPastebin } from '../controllers/pastebin'

const router = express.Router()

const csrfProtection = csurf()
const urlencodedParser = bodyParser.urlencoded({ extended: false })

router.get('/', csrfProtection, index)
router.post('/upload', urlencodedParser, csrfProtection, upload)
router.get('/:id', csrfProtection, viewPastebin)
router.post('/:id', urlencodedParser, csrfProtection, viewPastebin)
router.get('/:id/auth', csrfProtection, auth)
router.get('/:id/raw', rawPastebin)
router.post('/:id/raw', urlencodedParser, csrfProtection, rawPastebin)

export default router