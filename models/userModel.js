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
    address: {
      type: String,
      required: false,
      default: null,
    },
    firstName: {
      type: String,
      required: true,
      default: null,
    },
    lastName: {
      type: String,
      required: false,
      default: null,
    },
    role: {
      type: String,
      required: true,
      default: "user",
    },
    cart: {
      type: Array,
      default: [],
    },
    wishlist: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);
const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
