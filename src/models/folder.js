import Sequelize from 'sequelize'
import sequelize from '../utils/sequelize'

const Folder = sequelize.define('folder', {
	id: {
		type: Sequelize.STRING,
		primaryKey: true
	},
	expirationDate: {
		type: Sequelize.DATE,
		allowNull: false
	}
})

export default Folder