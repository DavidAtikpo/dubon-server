import { models } from '../models/index.js';

// Créer un litige
export const createDispute = async (req, res) => {
  try {
    const dispute = await models.Dispute.create({
      ...req.body,
      userId: req.user.id,
      status: 'pending'
    });
    res.status(201).json({ success: true, data: dispute });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtenir les litiges de l'utilisateur
export const getUserDisputes = async (req, res) => {
  try {
    const disputes = await models.Dispute.findAll({
      where: { userId: req.user.id },
      include: ['order', 'messages']
    });
    res.json({ success: true, data: disputes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtenir les détails d'un litige
export const getDisputeDetails = async (req, res) => {
  try {
    const dispute = await models.Dispute.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      },
      include: ['order', 'messages']
    });
    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Litige non trouvé' });
    }
    res.json({ success: true, data: dispute });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Ajouter un message à un litige
export const addDisputeMessage = async (req, res) => {
  try {
    const message = await models.DisputeMessage.create({
      disputeId: req.params.id,
      userId: req.user.id,
      message: req.body.message
    });
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtenir tous les litiges (admin)
export const getAllDisputes = async (req, res) => {
  try {
    const disputes = await models.Dispute.findAll({
      include: ['user', 'order', 'messages']
    });
    res.json({ success: true, data: disputes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mettre à jour le statut d'un litige (admin)
export const updateDisputeStatus = async (req, res) => {
  try {
    await models.Dispute.update(
      { status: req.body.status },
      { where: { id: req.params.id } }
    );
    res.json({ success: true, message: 'Statut mis à jour' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Résoudre un litige (admin)
export const resolveDispute = async (req, res) => {
  try {
    await models.Dispute.update(
      { 
        status: 'resolved',
        resolution: req.body.resolution,
        resolvedAt: new Date()
      },
      { where: { id: req.params.id } }
    );
    res.json({ success: true, message: 'Litige résolu' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  createDispute,
  getUserDisputes,
  getDisputeDetails,
  addDisputeMessage,
  getAllDisputes,
  updateDisputeStatus,
  resolveDispute
}; 