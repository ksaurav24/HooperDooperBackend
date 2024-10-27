const zod = require("zod");
const { response } = require("express");

const updateOrderInputSchema = zod.object({
  status: zod.enum([
    "Pending",
    "Shipped",
    "Dispatched",
    "Cancelled",
    "Completed",
  ]),
});

const updateOrderInputValidation = (req, res, next) => {
  try {
    updateOrderInputSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      message: "Validation Error",
      error: error.errors,
    });
  }
};

module.exports = updateOrderInputValidation;
