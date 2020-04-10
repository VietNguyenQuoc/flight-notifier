const GoogleStrategy = require("passport-google-oauth2").Strategy;
const passport = require("passport");
const { User } = require("../models");

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findByPk(id);

  return done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID:
        "888664545789-e0dmit4selq1uq666kp9o38re88le4q2.apps.googleusercontent.com",
      clientSecret: "efSVTj73D_Ic9alDw7Yjasbt",
      callbackURL: "http://localhost:1507/auth/google/callback",
      passReqToCallback: true
    },
    async (request, accessToken, refreshToken, profile, done) => {
      try {
        const [user] = await User.findOrCreate({
          where: { googleId: profile.id },
          defaults: {
            email: profile.email,
            googleId: profile.id
          }
        });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);
