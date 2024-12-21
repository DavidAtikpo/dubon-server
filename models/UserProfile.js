import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class UserProfile extends Model {
    static associate(models) {
      UserProfile.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  UserProfile.init({
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
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    middleName: {
      type: DataTypes.STRING
    },
    displayName: {
      type: DataTypes.STRING
    },
    dateOfBirth: {
      type: DataTypes.DATE
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other')
    },
    avatar: {
      type: DataTypes.STRING
    },
    coverImage: {
      type: DataTypes.STRING
    },
    bio: {
      type: DataTypes.TEXT
    },
    occupation: {
      type: DataTypes.STRING
    },
    company: {
      type: DataTypes.STRING
    },
    website: {
      type: DataTypes.STRING,
      validate: {
        isUrl: true
      }
    },
    phoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    phoneVerificationCode: {
      type: DataTypes.STRING
    },
    phoneVerificationExpires: {
      type: DataTypes.DATE
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: 'fr'
    },
    timezone: {
      type: DataTypes.STRING,
      defaultValue: 'UTC'
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'XOF'
    },
    notificationPreferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        email: true,
        sms: false,
        push: true,
        orderUpdates: true,
        promotions: true,
        newsletter: true
      }
    },
    communicationPreferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        email: true,
        phone: true,
        whatsapp: false
      }
    },
    socialLinks: {
      type: DataTypes.JSONB,
      defaultValue: {
        facebook: null,
        twitter: null,
        instagram: null,
        linkedin: null,
        youtube: null
      }
    },
    interests: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'UserProfile',
    timestamps: true,
    indexes: [
      { fields: ['userId'], unique: true },
      { fields: ['phoneVerified'] },
      { fields: ['language'] },
      { fields: ['timezone'] }
    ]
  });

  return UserProfile;
}; 