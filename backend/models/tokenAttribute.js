import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class TokenAttribute extends Model {
    static associate(models) {
      TokenAttribute.belongsTo(models.Token, {
        foreignKey: 'tokenId',
        as: 'token'
      });
      TokenAttribute.belongsTo(models.Chain, {
        foreignKey: 'chainId',
        as: 'chain'
      });
    }
  }

  TokenAttribute.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tokenId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'token_id',
      references: {
        model: 'tokens',
        key: 'id'
      }
    },
    chainId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Nullable: NULL means global token attribute, NOT NULL means chain-specific
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
    modelName: 'TokenAttribute',
    tableName: 'token_attributes',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['token_id', 'chain_id', 'attribute_key']
      }
    ]
  });

  return TokenAttribute;
};
