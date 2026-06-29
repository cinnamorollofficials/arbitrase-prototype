import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class ChainAttribute extends Model {
    static associate(models) {
      ChainAttribute.belongsTo(models.Chain, {
        foreignKey: 'chainId',
        as: 'chain'
      });
    }
  }

  ChainAttribute.init({
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
    modelName: 'ChainAttribute',
    tableName: 'chain_attributes',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['chain_id', 'attribute_key']
      }
    ]
  });

  return ChainAttribute;
};
