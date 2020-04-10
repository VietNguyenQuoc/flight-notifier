const router = require("express").Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const qs = require("querystring");

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
  const token = jwt.sign(
    {
      id: req.user.id,
      email: req.user.email,
      googleId: req.user.googleId
    },
    "abc"
  );
  const query = qs.stringify({ token });
  return res.redirect(`${req.session.redirect_url}?${query}`);
});

module.exports = router;
