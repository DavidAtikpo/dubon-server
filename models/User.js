import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class User extends Model {
    static associate(models) {
      // One-to-Many Relations
      User.hasMany(models.Order, {
        foreignKey: 'userId',
        as: 'orders'
      });
      
      User.hasMany(models.Address, {
        foreignKey: 'userId',
        as: 'addresses'
      });
      
      User.hasMany(models.Review, {
        foreignKey: 'userId',
        as: 'reviews'
      });
      
      User.hasMany(models.UserActivity, {
        foreignKey: 'userId',
        as: 'activities'
      });
      
      User.hasMany(models.Notification, {
        foreignKey: 'userId',
        as: 'notifications'
      });
      
      User.hasMany(models.Favorite, {
        foreignKey: 'userId',
        as: 'favorites'
      });
      
      User.hasMany(models.Rating, {
        foreignKey: 'userId',
        as: 'ratings'
      });

      // One-to-One Relations
      User.hasOne(models.Cart, {
        foreignKey: 'userId',
        as: 'cart'
      });
      
      User.hasOne(models.SellerProfile, {
        foreignKey: 'userId',
        as: 'sellerProfile'
      });
      
      User.hasOne(models.UserProfile, {
        foreignKey: 'userId',
        as: 'profile'
      });

      // Messages Relations
      User.hasMany(models.Message, {
        foreignKey: 'senderId',
        as: 'sentMessages'
      });
      
      User.hasMany(models.Message, {
        foreignKey: 'receiverId',
        as: 'receivedMessages'
      });
    }
  }

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
    phone: {
      type: DataTypes.STRING,
      validate: {
        is: /^\+?[1-9]\d{1,14}$/ // Format E.164 pour numéros internationaux
      }
    },
    address: {
      type: DataTypes.JSONB,
      defaultValue: {},
      validate: {
        isValidAddress(value) {
          if (value) {
            const required = ['street', 'city', 'country'];
            for (const field of required) {
              if (!value[field]) {
                throw new Error(`${field} est requis dans l'adresse`);
              }
            }
          }
        }
      }
    },
    role: {
      type: DataTypes.ENUM('user', 'seller', 'admin'),
      defaultValue: 'user'
    },
    profilePhotoUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastLogin: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'blocked'),
      defaultValue: 'active'
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        notifications: {
          email: true,
          push: true
        },
        language: 'fr',
        currency: 'XOF'
      }
    }
  }, {
    sequelize,
    modelName: 'User',
    timestamps: true,
    underscored: true,
    tableName: 'Users',
    indexes: [
      { fields: ['email'] },
      { fields: ['phone'] },
      { fields: ['role'] },
      { fields: ['status'] }
    ]
  });

  return User;
};