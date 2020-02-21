import Sequelize from 'sequelize'
import sequelize from '../utils/sequelize'
import Folder from './folder'

const File = sequelize.define('file', {
	originalName: {
		type: Sequelize.STRING,
		allowNull: false
	},
	fileName: {
		type: Sequelize.STRING,
		allowNull: false
	}
})

File.belongsTo(Folder)
Folder.hasMany(File, { onDelete: 'CASCADE' })

export default File