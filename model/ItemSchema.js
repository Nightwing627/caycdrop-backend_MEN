const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const ItemSchema = new Schema({
  code: {
    type: SchemaTypes.String,
    index: true
  },
  name: { type: SchemaTypes.String },
  icon_url: { type: SchemaTypes.String },
  description: { type: SchemaTypes.String },
  brand: { type: SchemaTypes.String },
  value: { type: SchemaTypes.Number },
  usable: { type: SchemaTypes.Boolean },
  obtainable: { type: SchemaTypes.Boolean },
  withdrawable: { type: SchemaTypes.Boolean },
  rarity: { type: SchemaTypes.String },
  currency: { type: SchemaTypes.String },
  released_at: { type: SchemaTypes.Date },
  type: { type: SchemaTypes.String },
  category: [{
    type: SchemaTypes.ObjectId,
    ref: 'Tag'
  }],
  shipping_cost: { type: SchemaTypes.Number },
  min_value: { type: SchemaTypes.Number },
  max_value: { type: SchemaTypes.Number },
  min_rarity: { type: SchemaTypes.String },
  max_rarity: { type: SchemaTypes.String },
  variants: [{
    type: SchemaTypes.ObjectId,
    ref: 'ItemVariant'
  }],
  market: {
    type: SchemaTypes.ObjectId,
    ref: 'Market'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

ItemSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('Item', ItemSchema);
