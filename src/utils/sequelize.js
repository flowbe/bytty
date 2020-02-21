import Sequelize from 'sequelize'
import colors from '../utils/colors'

const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: 'database.sqlite'
})

// Testing the connection
sequelize.authenticate()
	.then(() => {
		console.log(`${colors.FG_GREEN}Connection to the database has been established successfully.${colors.RESET}`)
	})
	.catch(err => {
		console.error(`${colors.BRIGHT}${colors.FG_RED}Unable to connect to the database:${colors.RESET}`, err)
		process.exit()
	})

export default sequelize