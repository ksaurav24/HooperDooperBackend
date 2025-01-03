const zod = require("zod");
const { response } = require("express");

const registerInputSchema = zod.object({
  email: zod.string().email(),
  password: zod.string().min(6),
  fullName: zod.string().min(3),
  phone: zod
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number can't exceed 15 digits"),
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
    console.log(error);
    res.status(400).json({
      message: "Validation Error",
      error: error.errors,
    });
  }
};

const orderValidationSchema = zod.object({
  orderItems: zod
    .array(
      zod.object({
        quantity: zod.number().min(1, "Quantity must be at least 1"),
        product: zod.string().nonempty("Product ID is required"),
      })
    )
    .min(1, "Order must have at least one item"),
  shippingAddress: zod.string().nonempty("Shipping address is required"),
  city: zod.string().nonempty("City is required"),
  zip: zod.string().nonempty("Zip code is required"),
  country: zod.string().nonempty("Country is required"),
  phone: zod
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number can't exceed 15 digits"),
});

const validateOrderInput = (req, res, next) => {
  try {
    orderValidationSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      error: error.errors,
    });
  }
};

const ticketValidationSchema = zod.object({
  title: zod.string().min(1),
  description: zod.string().min(1),
  category: zod.enum([
    "general",
    "complaint",
    "order",
    "return",
    "refund",
    "payment",
    "product",
  ]),
});

const validateTicketInput = (req, res, next) => {
  try {
    ticketValidationSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      error: error.errors,
    });
  }
};

module.exports = {
  registerInputValidation,
  loginInputValidation,
  validateTicketInput,
  validateOrderInput,
};
