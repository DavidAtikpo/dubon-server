import Joi from 'joi';

const personalInfoSchema = {
  individual: Joi.object({
    fullName: Joi.string().required().messages({
      'string.empty': 'Le nom complet est requis'
    }),
    address: Joi.string().required().messages({
      'string.empty': 'L\'adresse est requise'
    }),
    phone: Joi.string().required().pattern(/^\+?[0-9]{8,}$/).messages({
      'string.empty': 'Le numéro de téléphone est requis',
      'string.pattern.base': 'Format de numéro de téléphone invalide'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Format d\'email invalide',
      'string.empty': 'L\'email est requis'
    }),
    taxNumber: Joi.string().required().length(13).pattern(/^\d+$/).messages({
      'string.empty': 'Le numéro IFU est requis',
      'string.length': 'Le numéro IFU doit contenir exactement 13 chiffres',
      'string.pattern.base': 'Le numéro IFU doit contenir uniquement des chiffres'
    }),
    idType: Joi.string().required().valid('CIP', 'PASSPORT', 'CEDEAO', 'RAVIP').messages({
      'any.only': 'Type de document d\'identité invalide'
    }),
    idNumber: Joi.string().required().messages({
      'string.empty': 'Le numéro d\'identification est requis'
    })
  }),
  company: Joi.object({
    companyName: Joi.string().required().messages({
      'string.empty': 'La raison sociale est requise'
    }),
    rccmNumber: Joi.string().required().messages({
      'string.empty': 'Le numéro RCCM est requis'
    }),
    legalRepName: Joi.string().required().messages({
      'string.empty': 'Le nom du représentant légal est requis'
    }),
    address: Joi.string().required().messages({
      'string.empty': 'L\'adresse est requise'
    }),
    phone: Joi.string().required().pattern(/^\+?[0-9]{8,}$/).messages({
      'string.empty': 'Le numéro de téléphone est requis',
      'string.pattern.base': 'Format de numéro de téléphone invalide'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Format d\'email invalide',
      'string.empty': 'L\'email est requis'
    }),
    taxNumber: Joi.string().required().length(13).pattern(/^\d+$/).messages({
      'string.empty': 'Le numéro IFU est requis',
      'string.length': 'Le numéro IFU doit contenir exactement 13 chiffres',
      'string.pattern.base': 'Le numéro IFU doit contenir uniquement des chiffres'
    })
  })
};

const businessInfoSchema = Joi.object({
  shopName: Joi.string().required().messages({
    'string.empty': 'Le nom de la boutique est requis'
  }),
  category: Joi.string().required().messages({
    'string.empty': 'La catégorie est requise'
  }),
  description: Joi.string().required().min(50).max(1000).messages({
    'string.empty': 'La description est requise',
    'string.min': 'La description doit contenir au moins 50 caractères',
    'string.max': 'La description ne doit pas dépasser 1000 caractères'
  }),
  shopImage: Joi.any().optional(),
  shopVideo: Joi.any().optional(),
  country: Joi.string().required().messages({
    'string.empty': 'Le pays est requis'
  }),
  paymentType: Joi.string().required().valid('Compte bancaire', 'Mobile Money').messages({
    'any.only': 'Type de paiement invalide'
  }),
  paymentDetails: Joi.string().required().messages({
    'string.empty': 'Les détails de paiement sont requis'
  })
});

const complianceSchema = Joi.object({
  termsAccepted: Joi.boolean().valid(true).required().messages({
    'any.only': 'Vous devez accepter les conditions d\'utilisation'
  }),
  qualityStandardsAccepted: Joi.boolean().valid(true).required().messages({
    'any.only': 'Vous devez accepter les normes de qualité'
  }),
  antiCounterfeitingAccepted: Joi.boolean().valid(true).required().messages({
    'any.only': 'Vous devez accepter la politique anti-contrefaçon'
  })
});

const sellerRegistrationSchema = Joi.object({
  data: Joi.object({
    type: Joi.string()
      .valid('individual', 'company')
      .required()
      .messages({
        'any.only': 'Le type doit être "individual" ou "company"'
      }),
    personalInfo: Joi.alternatives().conditional('type', {
      is: 'individual',
      then: personalInfoSchema.individual,
      otherwise: personalInfoSchema.company
    }),
    businessInfo: businessInfoSchema,
    compliance: complianceSchema
  }).required()
});

export const validateSellerRegistration = (req, res, next) => {
  try {
    // Vérifier que data est présent et est un objet JSON valide
    if (!req.body.data) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: [{ field: 'data', message: 'Les données sont requises' }]
      });
    }

    let data;
    try {
      data = JSON.parse(req.body.data);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: [{ field: 'data', message: 'Format JSON invalide' }]
      });
    }

    // Valider les données avec le schéma
    const { error } = sellerRegistrationSchema.validate(
      { data },
      { abortEarly: false }
    );

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Vérifier les fichiers requis
    const requiredFiles = data.type === 'individual'
      ? ['idCard', 'proofOfAddress', 'taxCertificate', 'photos']
      : ['idCard', 'rccm', 'companyStatutes', 'taxCertificate', 'proofOfAddress'];

    const missingFiles = requiredFiles.filter(field => !req.files[field]);

    if (missingFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Documents manquants',
        errors: missingFiles.map(field => ({
          field,
          message: `Le document ${field} est requis`
        }))
      });
    }

    next();
  } catch (error) {
    console.error('Erreur de validation:', error);
    res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: [{ message: error.message }]
    });
  }
};

export default {
  validateSellerRegistration
};
