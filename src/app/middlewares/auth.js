const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const { authorization: accessToken } = req.headers;

    if (!accessToken)
      return res.status(401).json({
        success: false,
        message: "Missing access token"
      });
    const user = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);

    req.user = user;
    next();
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: e.message
    })
  }
};
