import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Exchange extends Model {
    static associate(models) {
      Exchange.hasMany(models.ExchangeAttribute, {
        foreignKey: 'exchangeId',
        as: 'attributes',
        onDelete: 'CASCADE'
      });
      Exchange.hasMany(models.TokenPair, {
        foreignKey: 'exchangeId',
        as: 'tokenPairs',
        onDelete: 'CASCADE'
      });
      Exchange.hasMany(models.Fee, {
        foreignKey: 'exchangeId',
        as: 'fees',
        onDelete: 'CASCADE'
      });
    }
  }

  Exchange.init({
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
    type: {
      type: DataTypes.ENUM('CEX', 'DEX'),
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    websiteUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'website_url'
    },
    logoUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'logo_url'
    },
    isRegisteredIndonesia: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_registered_indonesia'
    },
    rating: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true
    },
    capital: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Exchange',
    tableName: 'exchanges',
    underscored: true
  });

  return Exchange;
};
