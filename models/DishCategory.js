import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const DishCategory = sequelize.define('DishCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  }
});

export default DishCategory; 