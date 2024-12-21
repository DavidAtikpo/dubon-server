import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const UserPreference = sequelize.define('UserPreference', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: 'fr'
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'FCFA'
    },
    notifications: {
      type: DataTypes.JSONB,
      defaultValue: {
        email: true,
        push: true,
        sms: false
      }
    },
    newsletter: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    theme: {
      type: DataTypes.STRING,
      defaultValue: 'light'
    }
  });

  UserPreference.associate = (models) => {
    UserPreference.belongsTo(models.User);
  };

  return UserPreference;
}; 