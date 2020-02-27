import express from 'express'
import path from 'path'
import session from 'express-session'
import flash from 'express-flash'
import cookieParser from 'cookie-parser'
import routes from './routes/routes'
import pastebin from './routes/pastebin'
import config from '../config.json'
import colors from './utils/colors'
import sequelize from './utils/sequelize'
import File from './models/file'
import Folder from './models/folder'
import Pastebin from './models/pastebin'

sequelize.sync()

const app = express()

// set the view engine to ejs
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// session
app.set('trust proxy', 1) // trust first proxy
app.use(session({
	secret: 'lMcjCG2Tw6FxYlNLk0q2n3DTdvM7vG6p',
	resave: false,
	saveUninitialized: true
}))
app.use(flash())

// cookies
app.use(cookieParser('AXvXsQ7MI6KjAy0hTb8S4MlHibqCzH24'))

app.use('/static', express.static(path.join(__dirname, 'public')))

app.use(routes)
app.use('/pastebin', pastebin)

// Error handling
app
	.use((req, res, next) => {
		const err = new Error('Page not found')
		err.statusCode = 404
		next(err)
	})
	.use((err, req, res, next) => {
		err.statusCode = err.statusCode || 500
		console.error(err)
		res.status(err.statusCode).render('error', { error: err })
	})

app.listen(config.PORT, () => {
	console.log(`${colors.BRIGHT}${colors.FG_GREEN}Running on http://*:${config.PORT}${colors.RESET}`)
})
