const isVerified = async (req, res, next) => {
  try {
    if (req.user.isVerified) {
      return next();
    }
    return res.status(401).json({ message: "Please verify your email" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = isVerified;
