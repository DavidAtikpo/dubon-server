import { models, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

export const getChatMessages = async (req, res) => {
  const { sellerId } = req.params;
  try {
    const messages = await models.ChatMessage.findAll({
      where: { sellerId },
      order: [['createdAt', 'ASC']]
    });
    res.json({ messages });
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
  }
};

export const sendChatMessage = async (req, res) => {
  const { sellerId, message } = req.body;
  try {
    const newMessage = await models.ChatMessage.create({
      sellerId,
      content: message,
      sender: 'user' // ou 'seller' selon le cas
    });
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
  }
};

export const getUserConversations = async (req, res) => {
  const userId = req.user.id;
  try {
    const conversations = await models.ChatMessage.findAll({
      where: { userId },
      group: ['ChatMessage.sellerId', 'SellerProfile.id'],
      attributes: [
        'sellerId',
        [sequelize.fn('MAX', sequelize.col('ChatMessage.createdAt')), 'lastMessageDate'],
        [sequelize.fn('MAX', sequelize.col('ChatMessage.content')), 'lastMessage']
      ],
      include: [{
        model: models.SellerProfile,
        attributes: ['id'],
        required: true
      }],
      order: [[sequelize.fn('MAX', sequelize.col('ChatMessage.createdAt')), 'DESC']]
    });

    const formattedConversations = conversations.map(conv => ({
      sellerId: conv.sellerId,
      sellerName: conv.SellerProfile.name,
      lastMessage: conv.dataValues.lastMessage,
      lastMessageDate: conv.dataValues.lastMessageDate
    }));

    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des conversations' });
  }
};

export const getSellerConversations = async (req, res) => {
  try {
    // Récupérer d'abord le profil vendeur
    const sellerProfile = await models.SellerProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!sellerProfile) {
      return res.status(404).json({ message: 'Profil vendeur non trouvé' });
    }

    const sellerId = sellerProfile.id;
    console.log('User ID:', req.user.id);
    console.log('Seller Profile ID:', sellerId);

    const conversations = await models.ChatMessage.findAll({
      where: { 
        sellerId: sellerId // Utiliser l'ID du profil vendeur
      },
      group: ['ChatMessage.userId', 'User.id', 'User.name'],
      attributes: [
        'userId',
        [sequelize.fn('MAX', sequelize.col('ChatMessage.createdAt')), 'lastMessageDate'],
        [sequelize.fn('MAX', sequelize.col('ChatMessage.content')), 'lastMessage'],
        [
          sequelize.fn('COUNT', 
            sequelize.literal('CASE WHEN "ChatMessage"."read" = false AND "ChatMessage"."sender" = \'user\' THEN 1 END')
          ),
          'unreadCount'
        ]
      ],
      include: [{
        model: models.User,
        attributes: ['id', 'name'],
        required: true
      }],
      order: [[sequelize.fn('MAX', sequelize.col('ChatMessage.createdAt')), 'DESC']]
    });

    const formattedConversations = conversations.map(conv => ({
      userId: conv.userId,
      userName: conv.User.name,
      lastMessage: conv.dataValues.lastMessage,
      lastMessageDate: conv.dataValues.lastMessageDate,
      unreadCount: parseInt(conv.dataValues.unreadCount || '0')
    }));

    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Erreur détaillée:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des conversations',
      error: error.message 
    });
  }
};

export const getMessages = async (req, res) => {
  const { userId, sellerId } = req.params;
  const currentUserRole = req.user.role;
  
  try {
    let whereClause = {};
    
    if (currentUserRole === 'seller') {
      const sellerProfile = await models.SellerProfile.findOne({
        where: { userId: req.user.id }
      });

      if (!sellerProfile) {
        return res.status(404).json({ message: 'Profil vendeur non trouvé' });
      }

      whereClause = {
        sellerId: sellerProfile.id,
        userId: userId
      };
    } else {
      whereClause = {
        sellerId: sellerId,
        userId: req.user.id
      };
    }

    const messages = await models.ChatMessage.findAll({
      where: whereClause,
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: models.User,
          attributes: ['id', 'name']
        }
      ]
    });

    // Marquer les messages comme lus
    if (messages.length > 0) {
      const updateWhere = {
        ...whereClause,
        read: false,
        sender: currentUserRole === 'seller' ? 'user' : 'seller'
      };
      
      await models.ChatMessage.update(
        { read: true },
        { where: updateWhere }
      );
    }

    res.json({ messages });
  } catch (error) {
    console.error('Erreur détaillée:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des messages',
      error: error.message 
    });
  }
};

export const sendMessage = async (req, res) => {
  const { content, userId, sellerId } = req.body;
  const sender = req.user.role === 'seller' ? 'seller' : 'user';
  
  try {
    let actualSellerId = sellerId;
    
    // Si c'est un vendeur qui envoie le message
    if (sender === 'seller') {
      const sellerProfile = await models.SellerProfile.findOne({
        where: { userId: req.user.id }
      });

      if (!sellerProfile) {
        return res.status(404).json({ message: 'Profil vendeur non trouvé' });
      }
      actualSellerId = sellerProfile.id;
    }

    const newMessage = await models.ChatMessage.create({
      content,
      sender,
      userId: userId || req.user.id,
      sellerId: actualSellerId
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Erreur détaillée lors de l\'envoi du message:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'envoi du message',
      error: error.message 
    });
  }
};

export const getAdminConversations = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    // Récupérer toutes les conversations avec les détails des vendeurs et utilisateurs
    const conversations = await models.ChatMessage.findAll({
      attributes: [
        'sellerId',
        'userId',
        [sequelize.fn('MAX', sequelize.col('ChatMessage.createdAt')), 'lastMessageDate'],
        [sequelize.fn('COUNT', 
          sequelize.literal('CASE WHEN "ChatMessage"."read" = false THEN 1 END')
        ), 'unreadCount'],
        [sequelize.fn('MAX', sequelize.col('ChatMessage.content')), 'lastMessage']
      ],
      include: [
        {
          model: models.SellerProfile,
          // attributes: ['name'],
          required: true
        },
        {
          model: models.User,
          attributes: ['name', 'email'],
          required: true
        }
      ],
      group: [
        'ChatMessage.sellerId', 
        'ChatMessage.userId', 
        'SellerProfile.id', 
        // 'SellerProfile.name',
        'User.id', 
        'User.name', 
        'User.email'
      ],
      order: [[sequelize.fn('MAX', sequelize.col('ChatMessage.createdAt')), 'DESC']]
    });

    // Formater les données pour le front
    const formattedConversations = conversations.map(conv => ({
      sellerId: conv.sellerId,
      userId: conv.userId,
      // sellerName: conv.SellerProfile.name,
      userName: conv.User.name,
      userEmail: conv.User.email,
      lastMessage: conv.dataValues.lastMessage,
      lastMessageDate: conv.dataValues.lastMessageDate,
      unreadCount: parseInt(conv.dataValues.unreadCount || '0')
    }));

    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des conversations',
      error: error.message 
    });
  }
};

export const getAdminMessages = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const { sellerId, userId } = req.params;

    const messages = await models.ChatMessage.findAll({
      where: {
        sellerId,
        userId
      },
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: models.User,
          attributes: ['name'],
        },
        {
          model: models.SellerProfile,
          // attributes: ['name'],

        }
      ]
    });

    res.json({ messages });
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des messages',
      error: error.message 
    });
  }
};