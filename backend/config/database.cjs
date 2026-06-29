const dotenv = require('dotenv');
dotenv.config();

const config = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME || 'arbitrage_db',
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  logging: false,
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
