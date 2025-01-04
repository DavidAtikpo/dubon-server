import SellerRequest from '../models/SellerRequest';
import User from '../models/User';
import { uploadFile } from '../utils/fileUpload';
import { validateSellerRequest } from '../utils/validation';

class SellerController {
  // Soumettre une nouvelle demande
  async submitRequest(req, res) {
    try {
      const userId = req.user.id;
      
      // Vérifier si une demande existe déjà
      const existingRequest = await SellerRequest.findOne({ userId, status: 'pending' });
      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'Une demande est déjà en cours de traitement'
        });
      }

      // Upload des fichiers
      const files = {
        identityDocument: req.files?.identityDocument?.[0],
        businessLicense: req.files?.businessLicense?.[0],
        taxDocument: req.files?.taxDocument?.[0]
      };

      const uploadedFiles = {};
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          uploadedFiles[key] = await uploadFile(file, 'seller-documents');
        }
      }

      // Valider les données
      const requestData = {
        ...req.body,
        categories: JSON.parse(req.body.categories || '[]'),
        mainProducts: JSON.parse(req.body.mainProducts || '[]'),
        ...uploadedFiles,
        userId,
        status: 'pending',
        createdAt: new Date()
      };

      const { error } = validateSellerRequest(requestData);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      // Créer la demande
      const sellerRequest = new SellerRequest(requestData);
      await sellerRequest.save();

      res.status(201).json({
        success: true,
        message: 'Demande soumise avec succès',
        data: sellerRequest
      });

    } catch (error) {
      console.error('Erreur soumission demande vendeur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la soumission de la demande'
      });
    }
  }

  // Obtenir le statut d'une demande
  async getRequestStatus(req, res) {
    try {
      const userId = req.user.id;
      const request = await SellerRequest.findOne({ userId }).sort({ createdAt: -1 });

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
      console.error('Erreur récupération statut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du statut'
      });
    }
  }

  // Admin: Lister toutes les demandes
  async listRequests(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const query = status ? { status } : {};

      const requests = await SellerRequest.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await SellerRequest.countDocuments(query);

      res.json({
        success: true,
        data: requests,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Erreur liste demandes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des demandes'
      });
    }
  }

  // Admin: Traiter une demande
  async processRequest(req, res) {
    try {
      const { requestId } = req.params;
      const { status, rejectionReason } = req.body;

      const request = await SellerRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Demande non trouvée'
        });
      }

      request.status = status;
      if (status === 'rejected' && rejectionReason) {
        request.rejectionReason = rejectionReason;
      }

      if (status === 'approved') {
        // Mettre à jour le rôle de l'utilisateur
        await User.findByIdAndUpdate(request.userId, {
          role: 'seller',
          sellerProfile: {
            businessName: request.companyName,
            businessType: request.businessType,
            registrationNumber: request.registrationNumber,
            categories: request.categories
          }
        });
      }

      await request.save();

      // TODO: Envoyer une notification à l'utilisateur

      res.json({
        success: true,
        message: `Demande ${status === 'approved' ? 'approuvée' : 'rejetée'} avec succès`,
        data: request
      });

    } catch (error) {
      console.error('Erreur traitement demande:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement de la demande'
      });
    }
  }
}

export default new SellerController(); 