import Joi from'joi';

// Schéma de validation pour la mise à jour des informations utilisateur
const updateUserSchema = Joi.object({
    
    name: Joi.string().pattern(/^[a-zA-Z]+$/).min(3).max(20).required(),
   
    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "org"] } }).required(),
   

    mobile: Joi.string().pattern(/^[0-9+]+$/).min(8).max(15).required()
   
});

// Middleware de validation pour la mise à jour des informations utilisateur
const validateUpdateUser = (req, res, next) => {
    const { error } = updateUserSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    next();
};

export default validateUpdateUser