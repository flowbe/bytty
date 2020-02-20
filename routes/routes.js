import express from 'express'
import { index, upload } from '../controllers/controller'

const router = express.Router()

router.get('/', index)
router.post('/upload', upload)

export default router