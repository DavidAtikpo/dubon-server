import { models } from '../models/index.js';
import path from 'path';
import fs from 'fs';
import { addDays } from 'date-fns';

// Soumettre une demande vendeur
export const submitRequest = async (req, res) => {
  try {
    const {
      businessType,
      businessName,
      businessAddress
    } = req.body;

    // Vérifier si une demande est déjà en cours
    const existingRequest = await models.SellerRequest.findOne({
      where: {
        userId: req.user.id,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Une demande est déjà en cours de traitement'
      });
    }

    // Créer les URLs pour les documents
    const idCardUrl = req.files['idCard'] ? 
      `/uploads/documents/id/${req.files['idCard'][0].filename}` : null;
    const addressProofUrl = req.files['addressProof'] ? 
      `/uploads/documents/address/${req.files['addressProof'][0].filename}` : null;
    const businessDocumentUrl = req.files['businessDocument'] ? 
      `/uploads/documents/business/${req.files['businessDocument'][0].filename}` : null;

    // Créer la demande
    const request = await models.SellerRequest.create({
      userId: req.user.id,
      businessType,
      businessName,
      businessAddress,
      idCardUrl,
      addressProofUrl,
      businessDocumentUrl
    });

    res.status(201).json({
      success: true,
      message: 'Demande soumise avec succès',
      data: request
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Vérifier le statut d'une demande
export const checkRequestStatus = async (req, res) => {
  try {
    const request = await models.SellerRequest.findOne({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Aucune demande trouvée'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Activer l'abonnement après paiement
export const activateSubscription = async (req, res) => {
  try {
    const { requestId, plan } = req.body;
    const request = await models.SellerRequest.findByPk(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    // Calculer les dates d'expiration
    const now = new Date();
    let subscriptionEnd = new Date();
    
    switch (plan) {
      case 'monthly':
        subscriptionEnd = addDays(now, 30);
        break;
      case 'biannual':
        subscriptionEnd = addDays(now, 180);
        break;
      case 'annual':
        subscriptionEnd = addDays(now, 365);
        break;
      case 'commission':
        subscriptionEnd = null;
        break;
    }

    await request.update({
      subscriptionPlan: plan,
      subscriptionStatus: 'active',
      subscriptionEndsAt: subscriptionEnd
    });

    res.json({
      success: true,
      message: 'Abonnement activé avec succès',
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 