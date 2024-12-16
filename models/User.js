import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('user', 'seller', 'admin', 'superAdmin'),
      defaultValue: 'user'
    },
    is_trial_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    trial_end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    subscription_paid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_blocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    profile_photo_url: {
      type: DataTypes.STRING,
      defaultValue: '/default-user-profile-svgrepo-com (1).svg'
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    email_verification_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email_verification_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refresh_token: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'users',
    freezeTableName: true
  });

  return User;
};