const zod = require("zod");

const mailInputSchema = zod.object({
  email: zod.string().email(),
  subject: zod.string(),
  message: zod.string(),
});

const sendMailInputValidation = async (req, res, next) => {
  try {
    mailInputSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.errors[0],
    });
  }
};

module.exports = sendMailInputValidation;
