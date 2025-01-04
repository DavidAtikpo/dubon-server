import Joi from 'joi';

// Validation du formulaire de demande vendeur
export const validateSellerRequest = (data) => {
  const schema = Joi.object({
    // Informations personnelles
    fullName: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Le nom complet est requis',
        'string.min': 'Le nom doit contenir au moins 2 caractères',
        'string.max': 'Le nom ne peut pas dépasser 100 caractères'
      }),

    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email invalide',
        'string.empty': 'L\'email est requis'
      }),

    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
      .required()
      .messages({
        'string.pattern.base': 'Numéro de téléphone invalide',
        'string.empty': 'Le numéro de téléphone est requis'
      }),

    // Informations entreprise
    companyName: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Le nom de l\'entreprise est requis',
        'string.min': 'Le nom de l\'entreprise doit contenir au moins 2 caractères'
      }),

    registrationNumber: Joi.string()
      .pattern(/^[0-9]{9}$|^[0-9]{14}$/)
      .required()
      .messages({
        'string.pattern.base': 'Numéro SIRET/SIREN invalide',
        'string.empty': 'Le numéro d\'enregistrement est requis'
      }),

    vatNumber: Joi.string()
      .pattern(/^FR[0-9A-Z]{2}[0-9]{9}$/)
      .allow('')
      .messages({
        'string.pattern.base': 'Numéro de TVA invalide'
      }),

    businessType: Joi.string()
      .valid('retail', 'wholesale', 'manufacturer', 'service', 'distributor')
      .required()
      .messages({
        'any.only': 'Type d\'activité invalide',
        'string.empty': 'Le type d\'activité est requis'
      }),

    yearEstablished: Joi.string()
      .pattern(/^[0-9]{4}$/)
      .required()
      .messages({
        'string.pattern.base': 'Année invalide',
        'string.empty': 'L\'année de création est requise'
      }),

    employeeCount: Joi.string()
      .valid('1-5', '6-25', '26-100', '101-500', '500+')
      .required()
      .messages({
        'any.only': 'Nombre d\'employés invalide',
        'string.empty': 'Le nombre d\'employés est requis'
      }),

    annualRevenue: Joi.string()
      .valid('< 50,000 €', '50,000 € - 200,000 €', '200,000 € - 1M €', '> 1M €')
      .required()
      .messages({
        'any.only': 'Chiffre d\'affaires invalide',
        'string.empty': 'Le chiffre d\'affaires est requis'
      }),

    // Documents
    identityDocument: Joi.string()
      .required()
      .messages({
        'string.empty': 'La pièce d\'identité est requise'
      }),

    businessLicense: Joi.string()
      .required()
      .messages({
        'string.empty': 'Le document d\'enregistrement est requis'
      }),

    taxDocument: Joi.string()
      .required()
      .messages({
        'string.empty': 'L\'attestation fiscale est requise'
      }),

    // Capacités
    categories: Joi.array()
      .items(Joi.string())
      .min(1)
      .required()
      .messages({
        'array.min': 'Sélectionnez au moins une catégorie',
        'array.base': 'Les catégories sont requises'
      }),

    mainProducts: Joi.array()
      .items(Joi.string())
      .optional(),

    exportCapability: Joi.boolean()
      .default(false),

    // Adresse
    address: Joi.string()
      .required()
      .messages({
        'string.empty': 'L\'adresse est requise'
      }),

    city: Joi.string()
      .required()
      .messages({
        'string.empty': 'La ville est requise'
      }),

    postalCode: Joi.string()
      .pattern(/^[0-9]{5}$/)
      .required()
      .messages({
        'string.pattern.base': 'Code postal invalide',
        'string.empty': 'Le code postal est requis'
      }),

    country: Joi.string()
      .required()
      .messages({
        'string.empty': 'Le pays est requis'
      })
  });

  return schema.validate(data, { abortEarly: false });
};

// Validation de la mise à jour du profil vendeur
export const validateSellerProfileUpdate = (data) => {
  const schema = Joi.object({
    companyName: Joi.string().min(2).max(100),
    phone: Joi.string().pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/),
    address: Joi.string(),
    city: Joi.string(),
    postalCode: Joi.string().pattern(/^[0-9]{5}$/),
    categories: Joi.array().items(Joi.string()),
    mainProducts: Joi.array().items(Joi.string()),
    exportCapability: Joi.boolean()
  });

  return schema.validate(data, { abortEarly: false });
}; 