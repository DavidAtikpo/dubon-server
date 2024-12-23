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

export const validateSellerRegistration = async (req, res, next) => {
  try {
    await sellerRegistrationSchema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
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

export default {
  validateSellerRegistration
};
