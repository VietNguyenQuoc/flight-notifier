const app = require('./app/app');

const server = app.listen(1507, () => {
  console.log(`Flight price notifier is listening...`);
});

module.exports = server;
