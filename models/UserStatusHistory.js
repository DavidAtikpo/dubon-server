module.exports = (sequelize, DataTypes) => {
  const UserStatusHistory = sequelize.define('UserStatusHistory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    oldStatus: {
      type: DataTypes.STRING,
      allowNull: false
    },
    newStatus: {
      type: DataTypes.STRING,
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    performedById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    timestamps: true
  });

  UserStatusHistory.associate = (models) => {
    UserStatusHistory.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    UserStatusHistory.belongsTo(models.User, {
      foreignKey: 'performedById',
      as: 'performedBy'
    });
  };

  return UserStatusHistory;
}; 