import Joi from 'joi';

const sellerRegistrationSchema = Joi.object({
  data: Joi.object({
    type: Joi.string()
      .valid('individual', 'company')
      .required()
      .messages({
        'any.only': 'Le type doit être "individual" ou "company"'
      }),

    personalInfo: Joi.object({
      fullName: Joi.string().required(),
      address: Joi.string().required(),
      phone: Joi.string().required(),
      idNumber: Joi.string().required(),
      email: Joi.string().email().required(),
      taxNumber: Joi.string().required()
    }).required(),

    businessInfo: Joi.object({
      products: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          description: Joi.string().required(),
          price: Joi.number().required(),
          images: Joi.array()
        })
      ),
      bankDetails: Joi.object({
        accountNumber: Joi.string().required()
      }).required(),
      category: Joi.string().required(),
      description: Joi.string().required(),
      returnPolicy: Joi.string().required()
    }).required(),

    compliance: Joi.object({
      termsAccepted: Joi.boolean().valid(true).required(),
      qualityStandardsAccepted: Joi.boolean().valid(true).required(),
      antiCounterfeitingAccepted: Joi.boolean().valid(true).required()
    }).required()
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

    // Vérifier les fichiers requis
    if (!req.files.idCard || !req.files.proofOfAddress || 
        !req.files.taxCertificate || !req.files.photos) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: [{ field: 'files', message: 'Tous les documents sont requis' }]
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
