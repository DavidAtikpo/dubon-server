import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Return extends Model {
    static associate(models) {
      Return.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });

      Return.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      Return.belongsTo(models.SellerProfile, {
        foreignKey: 'sellerId',
        as: 'seller'
      });

      Return.hasMany(models.Refund, {
        foreignKey: 'returnId',
        as: 'refunds'
      });
    }
  }

  Return.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'SellerProfiles',
        key: 'id'
      }
    },
    items: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'),
      defaultValue: 'pending'
    },
    returnMethod: {
      type: DataTypes.STRING,
      allowNull: false
    },
    returnAddress: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    trackingNumber: {
      type: DataTypes.STRING
    },
    shippingLabel: {
      type: DataTypes.STRING
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    processedBy: {
      type: DataTypes.UUID,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    processedAt: {
      type: DataTypes.DATE
    },
    receivedAt: {
      type: DataTypes.DATE
    },
    inspectionNotes: {
      type: DataTypes.TEXT
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2)
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Return',
    timestamps: true,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['userId'] },
      { fields: ['sellerId'] },
      { fields: ['status'] },
      { fields: ['processedBy'] }
    ]
  });

  return Return;
}; 