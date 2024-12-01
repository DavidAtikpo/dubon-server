import Joi from "joi";

const sellerValidationSchema = Joi.object({
  type: Joi.string().valid("individual", "company").required(),
  personalInfo: Joi.object({
    fullName: Joi.string().when("type", {
      is: "individual",
      then: Joi.required(),
    }),
    companyName: Joi.string().when("type", {
      is: "company",
      then: Joi.required(),
    }),
    address: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().required(),
    idNumber: Joi.string().when("type", {
      is: "individual",
      then: Joi.required(),
    }),
    taxNumber: Joi.string().required(),
    legalRepName: Joi.string().when("type", {
      is: "company",
      then: Joi.required(),
    }),
    rccmNumber: Joi.string().when("type", {
      is: "company",
      then: Joi.required(),
    }),
  }),
  compliance: Joi.object({
    termsAccepted: Joi.boolean().required(),
    qualityStandardsAccepted: Joi.boolean().required(),
    antiCounterfeitingAccepted: Joi.boolean().required(),
  }),
});

router.post("/seller/register", async (req, res) => {
  const { error } = sellerValidationSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  // Continue avec l'enregistrement...
});
