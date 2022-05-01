const Joi = require("joi");

const schema = Joi.object({
  password: Joi.string().min(6).required(),
  verification_code: Joi.string(),
  c_password: Joi.ref("password"),
});

module.exports = schema;