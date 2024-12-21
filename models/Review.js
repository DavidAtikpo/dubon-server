import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      Review.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });

      Review.belongsTo(models.Service, {
        foreignKey: 'serviceId',
        as: 'service'
      });

      Review.belongsTo(models.Event, {
        foreignKey: 'eventId',
        as: 'event'
      });

      Review.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });
    }
  }

  Review.init({
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
    productId: {
      type: DataTypes.UUID,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    serviceId: {
      type: DataTypes.UUID,
      references: {
        model: 'Services',
        key: 'id'
      }
    },
    eventId: {
      type: DataTypes.UUID,
      references: {
        model: 'Events',
        key: 'id'
      }
    },
    orderId: {
      type: DataTypes.UUID,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    title: {
      type: DataTypes.STRING
    },
    comment: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    verifiedPurchase: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    helpfulVotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    reportCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    adminResponse: {
      type: DataTypes.TEXT
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Review',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['productId'] },
      { fields: ['serviceId'] },
      { fields: ['eventId'] },
      { fields: ['orderId'] },
      { fields: ['status'] },
      { fields: ['verifiedPurchase'] }
    ]
  });

  return Review;
}; 