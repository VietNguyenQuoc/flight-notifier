const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const { authorization: accessToken } = req.headers;

  if (!accessToken)
    return res.status(401).json({
      success: false,
      message: "Missing access token"
    });

  const user = jwt.verify(accessToken, "abc");

  req.user = user;
  next();
};
