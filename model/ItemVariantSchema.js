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
  currency: { type: SchemaTypes.String }, 
  exchange_rate: {
    type: SchemaTypes.ObjectId,
    ref: 'ExchangeRate'
  },
  markets: [{
    type: SchemaTypes.ObjectId,
    ref: 'Market',
  }],
  estimated_delivery_in_hrs: { type: SchemaTypes.String },
}, {
  timestamps: {
  	createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

ItemVariantSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('ItemVariant', ItemVariantSchema);