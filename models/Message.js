import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.User, {
        foreignKey: 'senderId',
        as: 'sender'
      });

      Message.belongsTo(models.User, {
        foreignKey: 'receiverId',
        as: 'receiver'
      });

      Message.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });
    }
  }

  Message.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('text', 'image', 'file', 'system'),
      defaultValue: 'text'
    },
    attachments: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.ENUM('sent', 'delivered', 'read', 'failed'),
      defaultValue: 'sent'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Message',
    timestamps: true,
    indexes: [
      { fields: ['senderId'] },
      { fields: ['receiverId'] },
      { fields: ['orderId'] },
      { fields: ['type'] },
      { fields: ['isRead'] },
      { fields: ['status'] },
      { fields: ['createdAt'] }
    ]
  });

  return Message;
}; 