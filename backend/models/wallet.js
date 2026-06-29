import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Wallet extends Model {
    static associate(models) {
      Wallet.belongsTo(models.Chain, {
        foreignKey: 'chainId',
        as: 'chain'
      });
    }
  }

  Wallet.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    chainId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'chain_id',
      references: {
        model: 'chains',
        key: 'id'
      }
    },
    address: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    privateKeyEncrypted: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'private_key_encrypted'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    modelName: 'Wallet',
    tableName: 'wallets',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['chain_id', 'address']
      }
    ]
  });

  return Wallet;
};
