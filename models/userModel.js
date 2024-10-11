const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: true,
      min: 6,
      max: 255,
    },
    email: {
      type: String,
      required: false,
      min: 6,
      max: 255,
    },
    contact: {
      type: String,
      required: false,
      min: 6,
      max: 255,
    },
    profilePicture: {
      type: String,
      required: true,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },
    password: {
      type: String,
      required: false,
      min: 6,
      max: 1024,
    },
    isVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    verificationKey: {
      type: String,
      required: false,
      default: null,
    },
    verificationKeyExpiry: {
      type: Number,
      required: false,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      required: false,
      default: null,
    },
    resetPasswordExpiry: {
      type: Number,
      required: false,
      default: null,
    },

    country: {
      type: String,
      default: "",
    },
    fullName: {
      type: String,
      required: true,
      default: null,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    cart: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderItem",
        default: [],
      },
    ],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: [],
      },
    ],
  },
  {
    timestamps: true,
  }
);
const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
