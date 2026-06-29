import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Chain extends Model {
    static associate(models) {
      Chain.hasMany(models.ChainAttribute, {
        foreignKey: 'chainId',
        as: 'attributes',
        onDelete: 'CASCADE'
      });
      Chain.hasMany(models.TokenAttribute, {
        foreignKey: 'chainId',
        as: 'tokenAttributes',
        onDelete: 'CASCADE'
      });
    }
  }

  Chain.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    chainIdentifier: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'chain_identifier'
    },
    nativeSymbol: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'native_symbol'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    modelName: 'Chain',
    tableName: 'chains',
    underscored: true
  });

  return Chain;
};
