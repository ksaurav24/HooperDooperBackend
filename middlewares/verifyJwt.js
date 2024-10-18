const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const verifyJwt = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "No token provided",
        success: false,
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        message: "User not found",
        success: false,
      });
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      message: "Invalid token",
      success: false,
    });
  }
};

module.exports = verifyJwt;
