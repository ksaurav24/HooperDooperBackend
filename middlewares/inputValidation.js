const zod = require("zod");
const { response } = require("express");

const registerInputSchema = zod.object({
  email: zod.string().email(),
  password: zod.string().min(6),
  name: zod.string().min(3),
});

const registerInputValidation = (req, res, next) => {
  try {
    registerInputSchema.parse(req.body);
    console.log(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      message: "Validation Error",
      error: error.errors,
    });
  }
};

const loginInputSchema = zod.object({
  username: zod.string().min(6),
  password: zod.string().min(6),
});

const loginInputValidation = (req, res, next) => {
  try {
    loginInputSchema.parse(req.body);
    console.log(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      message: "Validation Error",
      error: error.errors,
    });
  }
};

module.exports = { registerInputValidation, loginInputValidation };
