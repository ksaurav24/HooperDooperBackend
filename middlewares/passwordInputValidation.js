const zod = require("zod");

const passwordSchema = zod
  .string()
  .min(6)
  .max(255)
  .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/);

const passwordInputValidation = async (password) => {
  const result = passwordSchema.safeParse(password);
  return result.success;
};

module.exports = passwordInputValidation;
