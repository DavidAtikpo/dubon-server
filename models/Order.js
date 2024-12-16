import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customer: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        hasRequiredFields(value) {
          const required = ['firstname', 'lastname', 'email', 'phone', 'address', 'city'];
          for (const field of required) {
            if (!value[field]) {
              throw new Error(`Le champ ${field} est requis`);
            }
          }
        }
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentMethod: DataTypes.STRING,
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    transactionId: DataTypes.STRING
  }, {
    timestamps: true
  });

  const OrderItem = sequelize.define('OrderItem', {
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    title: DataTypes.STRING
  });

  return { Order, OrderItem };
};