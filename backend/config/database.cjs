const dotenv = require('dotenv');
dotenv.config();

const config = {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME || 'arbitrage_db',
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false,
  dialectOptions: process.env.DB_SSL === 'true'
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    : {},
  define: {
    timestamps: true,
    underscored: true
  }
};

module.exports = {
  development: config,
  test: config,
  production: config
};
