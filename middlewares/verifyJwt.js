const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const verifyJwt = async (req, res, next) => {
  console.log(req.user);
  console.log(req.session);
  if (req.user) {
  }
};

module.exports = verifyJwt;
