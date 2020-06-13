module.exports = {
  "development": {
    "username": "root",
    "password": process.env.DB_PASSWORD,
    "database": "folite_development",
    "host": "127.0.0.1",
    "dialect": "mysql",
    "operatorsAliases": false,
    "logging": true
  },
  "test": {
    "username": process.env.DB_USERNAME,
    "password": process.env.DB_PASSWORD,
    "database": process.env.DB_NAME,
    "host": process.env.DB_HOST,
    "dialect": "mysql",
    "operatorsAliases": false
  },
  "production": {
    "username": process.env.DB_USERNAME,
    "password": process.env.DB_PASSWORD,
    "database": process.env.DB_NAME,
    "host": process.env.DB_HOST,
    "dialect": "mysql",
    pool: {
      max: process.env.DB_MAX_POOL ? parseInt(process.env.DB_MAX_POOL, 10) : 8,
      min: process.env.DB_MIN_POOL ? parseInt(process.env.DB_MIN_POOL, 10) : 3,
      acquire: 30000,
      idle: 10000,
    },
    "operatorsAliases": false
  }
}
