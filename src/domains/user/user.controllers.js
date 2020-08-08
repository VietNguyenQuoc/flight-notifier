const router = require("express").Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const qs = require("querystring");
const generateTokens = require('../../infra/services/generateTokens');

router.get(
  "/google",
  (req, _res, next) => {
    req.session.redirect_url = req.query.redirect_url;
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "/auth/google/success",
    failureRedirect: "/auth/google/failure"
  })
);

router.get("/google/success", (req, res) => {
  const payload = {
    id: req.user.id,
    email: req.user.email,
    googleId: req.user.googleId
  }

  const { accessToken, refreshToken } = generateTokens(payload);

  const query = qs.stringify({ accessToken, refreshToken });
  return res.redirect(`${req.session.redirect_url}?${query}`);
});

router.get('/token/refresh', (req, res) => {
  try {
    const { refreshToken } = req.query;
    if (!refreshToken) return res.status(400).send('Please provide the refresh token.');
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
    delete decoded.exp;
    delete decoded.iat;
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(decoded);
    console.log(newAccessToken, newRefreshToken);
    return res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });

  } catch (e) {
    console.error(e);
    res.status(403).send('Access token is malicious.');
  }
})
module.exports = router;
