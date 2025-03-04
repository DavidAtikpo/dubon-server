import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ChatMessage = sequelize.define('ChatMessage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sender: {
      type: DataTypes.ENUM('user', 'seller'),
      allowNull: false,
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'SellerProfiles',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  });

  ChatMessage.associate = (models) => {
    ChatMessage.belongsTo(models.SellerProfile, { foreignKey: 'sellerId' });
    ChatMessage.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return ChatMessage;
};