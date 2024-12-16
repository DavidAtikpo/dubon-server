import { DataTypes } from 'sequelize';
import { sequelize } from '../config/dbConfig.js';

const Training = sequelize.define('Training', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // ... autres champs
});

export default Training;
