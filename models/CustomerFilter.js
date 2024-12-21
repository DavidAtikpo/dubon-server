import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class CustomerFilter extends Model {
    static associate(models) {
      CustomerFilter.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });

      CustomerFilter.belongsTo(models.SellerProfile, {
        foreignKey: 'sellerId',
        as: 'seller'
      });
    }
  }

  CustomerFilter.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    sellerId: {
      type: DataTypes.UUID,
      references: {
        model: 'SellerProfiles',
        key: 'id'
      }
    },
    criteria: {
      type: DataTypes.JSONB,
      defaultValue: {
        orderCount: null,
        totalSpent: null,
        lastOrderDate: null,
        registrationDate: null,
        location: null,
        tags: [],
        categories: [],
        products: []
      }
    },
    conditions: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    sortBy: {
      type: DataTypes.STRING
    },
    sortOrder: {
      type: DataTypes.ENUM('asc', 'desc'),
      defaultValue: 'desc'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    createdBy: {
      type: DataTypes.UUID,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'CustomerFilter',
    timestamps: true,
    indexes: [
      { fields: ['sellerId'] },
      { fields: ['isActive'] },
      { fields: ['createdBy'] }
    ]
  });

  return CustomerFilter;
}; 