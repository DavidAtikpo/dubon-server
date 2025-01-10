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
      allowNull: true
    },
    monthlyPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    yearlyPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    features: {
      type: DataTypes.JSON,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
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