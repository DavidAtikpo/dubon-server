import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Service = sequelize.define('Service', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Général'
    },
    subCategory: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Général'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'Services'
  });

  Service.associate = (models) => {
    Service.belongsTo(models.User, {
      foreignKey: 'providerId',
      as: 'provider'
    });
  };

  return Service;
};
