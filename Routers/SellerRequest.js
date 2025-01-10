import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as sellerRequestController from '../Controllers/SellerRequestController.js';

import SellerController from '../Controllers/SellerController';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';
import upload from '../middleware/uploadMiddleware';

const router = express.Router();


// Configuration de l'upload pour les documents
const uploadFields = [
  { name: 'identityDocument', maxCount: 1 },
  { name: 'businessLicense', maxCount: 1 },
  { name: 'taxDocument', maxCount: 1 }
];

// Routes publiques
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des catégories' });
  }
});

// Routes protégées (utilisateur connecté)
router.post('/request', 
  authMiddleware,
  upload.fields(uploadFields),
  SellerController.submitRequest
);

router.get('/request/status', 
  authMiddleware,
  SellerController.getRequestStatus
);

// Routes admin
router.get('/requests', 
  authMiddleware,
  adminMiddleware,
  SellerController.listRequests
);

router.put('/request/:requestId', 
  authMiddleware,
  adminMiddleware,
  SellerController.processRequest
);

// Route pour la mise à jour du profil vendeur
router.put('/profile',
  authMiddleware,
  upload.single('profilePhoto'),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const sellerProfile = await SellerRequest.findOne({
        where: { 
          userId,
          status: 'approved'
        }
      });

      if (!sellerProfile) {
        return res.status(404).json({
          success: false,
          message: 'Profil vendeur non trouvé'
        });
      }

      // Mise à jour des informations
      const updates = { ...req.body };
      if (req.file) {
        updates.profilePhotoUrl = req.file.path;
      }

      await sellerProfile.update(updates);

      res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: sellerProfile
      });

    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du profil'
      });
    }
  }
);


router.get('/status', protect, sellerRequestController.checkRequestStatus);
router.post('/activate-subscription', protect, sellerRequestController.activateSubscription);

export default router;