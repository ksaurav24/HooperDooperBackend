const mongoose = require("mongoose");

const orderItemSchema = mongoose.Schema({
  quantity: {
    type: Number,
    required: true,
  },
  product: {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
});

const OrderItem =
  mongoose.models.OrderItem || mongoose.model("OrderItem", orderItemSchema);

module.exports = OrderItem;
