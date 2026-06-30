import { Sequelize } from 'sequelize';
import dbConfig from '../config/database.cjs';

import ChainModel from './chain.js';
import ChainAttributeModel from './chainAttribute.js';
import TokenModel from './token.js';
import TokenAttributeModel from './tokenAttribute.js';
import ExchangeModel from './exchange.js';
import ExchangeAttributeModel from './exchangeAttribute.js';
import WalletModel from './wallet.js';
import TokenPairModel from './tokenPair.js';
import FeeModel from './fee.js';

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = config.url
  ? new Sequelize(config.url, config)
  : new Sequelize(config.database, config.username, config.password, config);

const db = {
  sequelize,
  Sequelize,
  Chain: ChainModel(sequelize),
  ChainAttribute: ChainAttributeModel(sequelize),
  Token: TokenModel(sequelize),
  TokenAttribute: TokenAttributeModel(sequelize),
  Exchange: ExchangeModel(sequelize),
  ExchangeAttribute: ExchangeAttributeModel(sequelize),
  Wallet: WalletModel(sequelize),
  TokenPair: TokenPairModel(sequelize),
  Fee: FeeModel(sequelize)
};

// Run associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

export default db;
export { sequelize, Sequelize };
