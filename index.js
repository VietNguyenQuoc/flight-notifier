const express = require("express");
const session = require("express-session");
const app = express();

const passport = require("passport");

// Initialize redis client

app.use(express.json());
app.use(
  session({
    secret: "candydog",
    saveUninitialized: true,
    resave: true
  })
);
app.use(passport.initialize());
app.use(passport.session());
require("./services/passport");

app.use("/auth", require("./routes/auth"));
app.use('/flight', require('./routes/flight'));

app.listen(1507, () => {
  console.log(`Flight price notifier is listening...`);
});
