import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Table = sequelize.define('Table', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Restaurants',
        key: 'id'
      }
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('available', 'occupied', 'reserved', 'maintenance'),
      defaultValue: 'available'
    },
    location: {
      type: DataTypes.STRING, // ex: 'interior', 'terrace', 'vip'
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });

  return Table;
}; 