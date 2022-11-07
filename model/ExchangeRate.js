const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const ExchangeRateSchema = new Schema({
  currency: { type: SchemaTypes.String },
  rate: { type: SchemaTypes.Number },
  updated_at: { type: SchemaTypes.Number }
}, {
  timestamps: false
});

ExchangeRateSchema.plugin(uniqueValidator, { message: "is already exist" })

module.exports = mongoose.model('ExchangeRate', ExchangeRateSchema);