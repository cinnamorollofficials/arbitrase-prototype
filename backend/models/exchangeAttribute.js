import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class ExchangeAttribute extends Model {
    static associate(models) {
      ExchangeAttribute.belongsTo(models.Exchange, {
        foreignKey: 'exchangeId',
        as: 'exchange'
      });
    }
  }

  ExchangeAttribute.init({
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
    attributeKey: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'attribute_key'
    },
    attributeValue: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'attribute_value'
    },
    dataType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'string',
      field: 'data_type'
    }
  }, {
    sequelize,
    modelName: 'ExchangeAttribute',
    tableName: 'exchange_attributes',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['exchange_id', 'attribute_key']
      }
    ]
  });

  return ExchangeAttribute;
};
