import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Subscription extends Model {
    static associate(models) {
      Subscription.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      Subscription.belongsTo(models.Plan, {
        foreignKey: 'planId',
        as: 'plan'
      });
      Subscription.belongsTo(models.SellerProfile, {
        foreignKey: 'sellerId',
        as: 'seller'
      });
    }
  }

  Subscription.init({
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
    sellerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'SellerProfiles',
        key: 'id'
      }
    },
    planId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'Plans',
        key: 'id'
      }
    },
    billingCycle: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['monthly', 'annual']]
      }
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'active', 'cancelled', 'failed']]
      }
    },
    transactionId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Subscription',
    tableName: 'Subscriptions',
    timestamps: true
  });

  return Subscription;
}; 