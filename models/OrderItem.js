import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });
    }
  }

  OrderItem.init({
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    name: DataTypes.STRING,
    quantity: DataTypes.INTEGER,
    price: DataTypes.DECIMAL(10, 2)
    // ... autres champs
  }, {
    sequelize,
    modelName: 'OrderItem'
  });

  return OrderItem;
}; 