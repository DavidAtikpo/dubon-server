import Joi from 'joi';

// Schéma de validation pour l'inscription vendeur
const sellerRegistrationSchema = Joi.object({
  businessName: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.base': 'Le nom de l\'entreprise doit être une chaîne de caractères',
      'string.empty': 'Le nom de l\'entreprise est requis',
      'string.min': 'Le nom de l\'entreprise doit contenir au moins {#limit} caractères',
      'string.max': 'Le nom de l\'entreprise ne doit pas dépasser {#limit} caractères'
    }),

  businessType: Joi.string()
    .required()
    .messages({
      'string.empty': 'Le type d\'entreprise est requis'
    }),

  registrationNumber: Joi.string()
    .pattern(/^[A-Z0-9-]+$/)
    .messages({
      'string.pattern.base': 'Le numéro d\'enregistrement n\'est pas valide'
    }),

  taxId: Joi.string()
    .pattern(/^[A-Z0-9-]+$/)
    .messages({
      'string.pattern.base': 'Le numéro d\'identification fiscale n\'est pas valide'
    }),

  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string(),
    postalCode: Joi.string().required(),
    country: Joi.string().required()
  }).required()
    .messages({
      'object.base': 'L\'adresse doit être un objet valide'
    }),

  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Le numéro de téléphone n\'est pas valide'
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'L\'adresse email n\'est pas valide'
    }),

  website: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'L\'URL du site web n\'est pas valide'
    }),

  description: Joi.string()
    .min(50)
    .max(1000)
    .required()
    .messages({
      'string.min': 'La description doit contenir au moins {#limit} caractères',
      'string.max': 'La description ne doit pas dépasser {#limit} caractères'
    }),

  bankInfo: Joi.object({
    bankName: Joi.string().required(),
    accountNumber: Joi.string().required(),
    accountName: Joi.string().required(),
    swift: Joi.string()
  }).required()
});

// Middleware de validation
export const validateSellerRegistration = async (req, res, next) => {
  try {
    // Valider les données de la requête
    await sellerRegistrationSchema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    // Formater les erreurs de validation
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors
    });
  }
};

// Autres validations possibles
export const validateSellerUpdate = async (req, res, next) => {
  // Logique de validation pour la mise à jour du profil vendeur
  next();
};

export const validateProductCreation = async (req, res, next) => {
  // Logique de validation pour la création de produit
  next();
};

export default {
  validateSellerRegistration,
  validateSellerUpdate,
  validateProductCreation
};
