import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Fee extends Model {
    static associate(models) {
      Fee.belongsTo(models.Exchange, {
        foreignKey: 'exchangeId',
        as: 'exchange'
      });
      Fee.belongsTo(models.TokenPair, {
        foreignKey: 'tokenPairId',
        as: 'tokenPair'
      });
      Fee.belongsTo(models.Token, {
        foreignKey: 'tokenId',
        as: 'token'
      });
      Fee.belongsTo(models.Chain, {
        foreignKey: 'chainId',
        as: 'chain'
      });
      Fee.belongsTo(models.Token, {
        foreignKey: 'feeFlatTokenId',
        as: 'feeFlatToken'
      });
    }
  }

  Fee.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    feeType: {
      type: DataTypes.ENUM('CEX_TRADE', 'DEX_POOL', 'WITHDRAWAL', 'DEPOSIT', 'NETWORK_GAS'),
      allowNull: false,
      field: 'fee_type'
    },
    exchangeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'exchange_id',
      references: {
        model: 'exchanges',
        key: 'id'
      }
    },
    tokenPairId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'token_pair_id',
      references: {
        model: 'token_pairs',
        key: 'id'
      }
    },
    tokenId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'token_id',
      references: {
        model: 'tokens',
        key: 'id'
      }
    },
    chainId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'chain_id',
      references: {
        model: 'chains',
        key: 'id'
      }
    },
    feePercentage: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      field: 'fee_percentage'
    },
    feeFlat: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: true,
      field: 'fee_flat'
    },
    feeFlatTokenId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'fee_flat_token_id',
      references: {
        model: 'tokens',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    modelName: 'Fee',
    tableName: 'fees',
    underscored: true
  });

  return Fee;
};
