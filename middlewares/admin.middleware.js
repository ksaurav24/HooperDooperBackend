const isAdmin = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }
  next();
};

module.exports = isAdmin;
