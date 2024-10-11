const User = require("../models/userModel.js");

const isVerified = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    const { isVerified } = user;
    if (isVerified) {
      return next();
    }
    return res.status(401).json({ message: "Please verify your email" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = isVerified;
