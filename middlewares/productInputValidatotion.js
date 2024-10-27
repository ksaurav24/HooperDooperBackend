const zod = require("zod");

const productSchema = zod.object({
  title: zod.string().min(3),
  color: zod.string().min(3),
  description: zod.string().min(3),
  price: zod.number().positive(),
});

const productInputValidation = async (req, res, next) => {
  try {
    productSchema.parse(req.body.updatedProduct);
    req.product = req.body.updatedProduct;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.errors,
    });
  }
};

module.exports = productInputValidation;
