const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const ItemVariantSchema = new Schema({
  item_code: {
    type: SchemaTypes.String,
    index: true,
  },
  name: { type: SchemaTypes.String },
  size: { type: SchemaTypes.String },
  color: { type: SchemaTypes.String },
  min_value: { type: SchemaTypes.Number },
  max_value: { type: SchemaTypes.Number },
  exchange_rate: {
    type: SchemaTypes.ObjectId,
    ref: 'ExchangeRate'
  },
  shipping_cost: { type: SchemaTypes.Number },
  markets: [{
    type: SchemaTypes.ObjectId,
    ref: 'Market',
  }],
  min_rarity: { type: SchemaTypes.String },
  max_rarity: { type: SchemaTypes.String },
  estimated_delivery_in_hrs: { type: SchemaTypes.String },
}, {
  timestamps: true,
});

ItemVariantSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('ItemVariant', ItemVariantSchema);