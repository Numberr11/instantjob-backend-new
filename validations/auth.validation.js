const Joi = require('joi');

// 📌 Explanation in Hinglish:
// - `Joi` ek schema validator hai
// - Har field ka type, length, required hona etc. define kar sakte ho

exports.registerValidation = (data) => {
  const schema = Joi.object({
    full_name: Joi.string().required(),
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^[0-9]{10}$/),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'candidate').default('candidate'),
  }).or('email', 'phone'); // At least one is required

  return schema.validate(data);
};

exports.loginValidation = (data) => {
  const schema = Joi.object({
    emailOrPhone: Joi.string().required(),
    password: Joi.string().required(),
  });

  return schema.validate(data);
};
