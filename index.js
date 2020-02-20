import express from 'express'
import path from 'path'
import routes from './routes/routes'
import config from './config.json'

const app = express()

// set the view engine to ejs
app.set('view engine', 'ejs')

app.use('/static', express.static(path.join(__dirname, 'public')))
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')))

app.use(routes)

app.listen(config.PORT, () => {
	console.log(`Running on http://*:${config.PORT}`)
})
