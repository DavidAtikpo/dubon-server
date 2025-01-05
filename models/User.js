import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class User extends Model {}

  User.init({
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
      type: DataTypes.ENUM('user', 'seller', 'admin'),
      defaultValue: 'user'
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'banned'),
      defaultValue: 'active'
    },
    avatar: {
      type: DataTypes.STRING
    },
    lastLogin: {
      type: DataTypes.DATE
    },
    // Champs spécifiques aux vendeurs
    businessType: {
      type: DataTypes.ENUM('products', 'restaurant', 'training', 'events', 'services'),
      allowNull: true
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    storeId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    subscriptionStatus: {
      type: DataTypes.ENUM('trial', 'active', 'expired'),
      allowNull: true
    },
    subscriptionEndsAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    trialEndsAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Informations business additionnelles
    businessAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    businessPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    businessEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    }
  }, {
    sequelize,
    modelName: 'User',
    timestamps: true
  });

  // Ajouter cette partie pour définir l'association
  User.associate = (models) => {
    User.hasMany(models.SellerRequest, {
      foreignKey: 'userId',
      as: 'sellerRequests'
    });
  };

  return User;
};