import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class SellerStats extends Model {
    static associate(models) {
      SellerStats.belongsTo(models.SellerProfile, {
        foreignKey: {
          name: 'sellerId',
          allowNull: false,
          unique: true,
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        as: 'seller'
      });
    }
  }

  SellerStats.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    totalSales: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalCustomers: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalProducts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    averageOrderValue: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    dailyStats: {
      type: DataTypes.JSONB,
      defaultValue: {
        sales: {},
        orders: {},
        customers: {}
      }
    },
    weeklyStats: {
      type: DataTypes.JSONB,
      defaultValue: {
        sales: {},
        orders: {},
        customers: {}
      }
    },
    monthlyStats: {
      type: DataTypes.JSONB,
      defaultValue: {
        sales: {},
        orders: {},
        customers: {}
      }
    },
    yearlyStats: {
      type: DataTypes.JSONB,
      defaultValue: {
        sales: {},
        orders: {},
        customers: {}
      }
    },
    productPerformance: {
      type: DataTypes.JSONB,
      defaultValue: {
        topSelling: [],
        lowStock: [],
        outOfStock: []
      }
    },
    customerMetrics: {
      type: DataTypes.JSONB,
      defaultValue: {
        newCustomers: 0,
        repeatCustomers: 0,
        averageLifetimeValue: 0
      }
    },
    orderMetrics: {
      type: DataTypes.JSONB,
      defaultValue: {
        pending: 0,
        processing: 0,
        completed: 0,
        cancelled: 0,
        refunded: 0
      }
    },
    revenueBreakdown: {
      type: DataTypes.JSONB,
      defaultValue: {
        products: 0,
        services: 0,
        shipping: 0,
        tax: 0
      }
    },
    lastUpdated: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'SellerStats',
    timestamps: true,
    indexes: [
      { fields: ['sellerId'], unique: true }
    ]
  });

  return SellerStats;
}; 