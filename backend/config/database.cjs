const dotenv = require('dotenv');
dotenv.config();

const useSsl = process.env.DB_SSL === 'true';
const dialectOptions = useSsl
  ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
  : {};

const config = {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME || 'arbitrage_db',
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5433,
  dialect: 'postgres',
  logging: false,
  dialectOptions,
  define: {
    timestamps: true,
    underscored: true
  }
};

if (process.env.DATABASE_URL) {
  config.url = process.env.DATABASE_URL;
}

module.exports = {
  development: config,
  test: {
    ...config,
    database: process.env.DB_TEST_NAME || `${config.database}_test`
  },
  production: config
};
