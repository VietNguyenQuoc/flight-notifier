require('dotenv').config();
const express = require('express');
const session = require('express-session');
const app = express();
const morgan = require('morgan');
const passport = require('passport');
const openapi = require('openapi-comment-parser');
const swaggerUi = require('swagger-ui-express');

const WorkerServices = require('../domains/worker/worker.services');
WorkerServices.initializeJobs();

// Initialize redis client
app.use(morgan('common'));
app.use(express.json());
app.use(
  session({
    secret: 'candydog',
    saveUninitialized: true,
    resave: true
  })
);
app.use(passport.initialize());
app.use(passport.session());
require('../infra/services/passport');

const spec = openapi({
  cwd: require('path').resolve('../')
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
app.get('/spec', (_, res) => {
  res.json(spec);
});

app.use(require('./routes'));

app.use(function (err, _req, res, _next) { /* eslint-disable-line */
  return res.status(500).send(err.message || 'Internal server error');
});


module.exports = app;