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
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    timestamps: true
  });

  User.associate = (models) => {
    // Profil vendeur
    User.hasOne(models.SellerProfile, {
      foreignKey: 'userId',
      as: 'sellerProfile'
    });

    // Demandes vendeur
    User.hasMany(models.SellerRequest, {
      foreignKey: 'userId',
      as: 'sellerRequests'
    });

    // Commandes
    User.hasMany(models.Order, {
      foreignKey: 'userId',
      as: 'orders'
    });

    // Reviews
    User.hasMany(models.Review, {
      foreignKey: 'userId',
      as: 'reviews'
    });

    // Favoris
    User.hasMany(models.Favorite, {
      foreignKey: 'userId',
      as: 'favorites'
    });

    // Activité utilisateur
    User.hasMany(models.UserActivity, {
      foreignKey: 'userId',
      as: 'activities'
    });

    // Préférences utilisateur
    User.hasOne(models.UserProfile, {
      foreignKey: 'userId',
      as: 'profile'
    });

    // Panier
    User.hasOne(models.Cart, {
      foreignKey: 'userId',
      as: 'cart'
    });

    // Messages envoyés
    User.hasMany(models.Message, {
      foreignKey: 'senderId',
      as: 'sentMessages'
    });

    // Messages reçus
    User.hasMany(models.Message, {
      foreignKey: 'receiverId',
      as: 'receivedMessages'
    });

    // Ratings
    User.hasMany(models.Rating, {
      foreignKey: 'userId',
      as: 'ratings'
    });
  };

  return User;
};