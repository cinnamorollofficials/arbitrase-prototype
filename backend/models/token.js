import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Token extends Model {
    static associate(models) {
      Token.hasMany(models.TokenAttribute, {
        foreignKey: 'tokenId',
        as: 'attributes',
        onDelete: 'CASCADE'
      });
    }
  }

  Token.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    symbol: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    coingeckoId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'coingecko_id'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    modelName: 'Token',
    tableName: 'tokens',
    underscored: true
  });

  return Token;
};
