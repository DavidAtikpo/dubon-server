import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Subscription extends Model {
    static associate(models) {
      Subscription.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      Subscription.belongsTo(models.SellerProfile, {
        foreignKey: 'sellerProfileId',
        as: 'sellerProfile'
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
      allowNull: false
    },
    sellerProfileId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    planId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    billingCycle: {
      type: DataTypes.ENUM('monthly', 'annual'),
      allowNull: false
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'cancelled', 'expired'),
      defaultValue: 'pending'
    },
    transactionId: {
      type: DataTypes.STRING
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Subscription',
    tableName: 'Subscriptions',
    timestamps: true
  });

  return Subscription;
}; 