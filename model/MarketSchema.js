const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const MarketSchema = new Schema({
  code: {
    type: SchemaTypes.String,
    index: true
  },
  name: { type: SchemaTypes.String },
  slug: { type: SchemaTypes.String },
  currency: { type: SchemaTypes.String },
  countires: [{
    type: SchemaTypes.ObjectId,
    ref: 'Country'
  }],
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

MarketSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('Market', MarketSchema);