const jwt = require('jsonwebtoken');

const generateTokens = payload => {
  return ({
    accessToken: jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '30m' }),
    refreshToken: jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '7d' })
  });
}

module.exports = generateTokens;