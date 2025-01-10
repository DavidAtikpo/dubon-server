import { DataTypes } from 'sequelize';

const SellerProfile = (sequelize) => {
  const SellerProfile = sequelize.define('SellerProfile', {
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
    businessInfo: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false,
      validate: {
        notNull: true
      }
    },
    documents: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        notifications: true,
        autoAcceptOrders: false,
        displayEmail: true,
        displayPhone: true,
        language: 'fr',
        currency: 'XOF'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'suspended', 'blocked'),
      defaultValue: 'pending'
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      defaultValue: 'pending'
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    totalSales: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    commission: {
      type: DataTypes.FLOAT,
      defaultValue: 10 // 10% par défaut
    },
    verifiedAt: {
      type: DataTypes.DATE
    },
    statusReason: {
      type: DataTypes.STRING
    },
    statusUpdatedAt: {
      type: DataTypes.DATE
    }
  }, {
    timestamps: true,
    tableName: 'SellerProfiles'
  });

  SellerProfile.associate = (models) => {
    SellerProfile.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    SellerProfile.hasMany(models.Product, {
      foreignKey: 'sellerId',
      as: 'products'
    });

    SellerProfile.hasMany(models.Order, {
      foreignKey: 'sellerId',
      as: 'orders'
    });

    SellerProfile.hasMany(models.Promotion, {
      foreignKey: 'sellerId',
      as: 'promotions'
    });
  };

  return SellerProfile;
};

export default SellerProfile;
  