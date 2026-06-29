import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class TokenPair extends Model {
    static associate(models) {
      TokenPair.belongsTo(models.Exchange, {
        foreignKey: 'exchangeId',
        as: 'exchange'
      });
      TokenPair.belongsTo(models.Token, {
        foreignKey: 'baseTokenId',
        as: 'baseToken'
      });
      TokenPair.belongsTo(models.Token, {
        foreignKey: 'quoteTokenId',
        as: 'quoteToken'
      });
      TokenPair.hasMany(models.Fee, {
        foreignKey: 'tokenPairId',
        as: 'fees',
        onDelete: 'CASCADE'
      });
    }
  }

  TokenPair.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    exchangeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'exchange_id',
      references: {
        model: 'exchanges',
        key: 'id'
      }
    },
    baseTokenId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'base_token_id',
      references: {
        model: 'tokens',
        key: 'id'
      }
    },
    quoteTokenId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'quote_token_id',
      references: {
        model: 'tokens',
        key: 'id'
      }
    },
    symbol: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    modelName: 'TokenPair',
    tableName: 'token_pairs',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['exchange_id', 'base_token_id', 'quote_token_id']
      }
    ]
  });

  return TokenPair;
};
