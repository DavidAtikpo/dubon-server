export default (sequelize, DataTypes) => {
  const Plan = sequelize.define('Plan', {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    monthlyPrice: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    annualPrice: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    features: {
      type: DataTypes.JSONB,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('features');
        return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
      }
    }
  }, {
    tableName: 'Plans',
    timestamps: true
  });

  Plan.associate = (models) => {
    Plan.hasMany(models.Subscription, {
      foreignKey: 'planId',
      as: 'subscriptions'
    });
  };

  return Plan;
}; 