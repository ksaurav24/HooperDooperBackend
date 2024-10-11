const mongoose = require("mongoose");

const ticketSchema = mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
    },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: "Pending",
  },
  category: {
    type: String,
    required: true,
    default: "General",
  },
  priority: {
    type: String,
    required: true,
    default: "Low",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  dateOpened: {
    type: Date,
    default: Date.now(),
  },
  dateClosed: {
    type: Date,
  },
});

const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
