import Sequelize from 'sequelize'
import sequelize from '../utils/sequelize'

const Pastebin = sequelize.define('pastebin', {
	id: {
		type: Sequelize.STRING,
		primaryKey: true
	},
	content: {
		type: Sequelize.TEXT,
		allowNull: false
	},
	expirationDate: {
		type: Sequelize.DATE,
		allowNull: false
	},
	password: {
		type: Sequelize.STRING
	},
	salt: {
		type: Sequelize.STRING
	}
})

export default Pastebin