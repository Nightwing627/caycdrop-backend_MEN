const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const TransactionSchema = new Schema({
  code: {
    type: SchemaTypes.String,
    index: true
  },
  user_code: { type: SchemaTypes.String },
  amount: { type: SchemaTypes.Number },
  currency: { type: SchemaTypes.String },
  exchange_rate: { type: SchemaTypes.Number },
  exchanged_amount: { type: SchemaTypes.Number },
  method: { type: SchemaTypes.String },
  status: { type: SchemaTypes.String }, // started, completed
  url: { type: SchemaTypes.String },
  promo_code: { type: SchemaTypes.Number },
  bonus_percent: { type: SchemaTypes.Number },
  bonus_max_amount: { type: SchemaTypes.Number },
  bouns_amount: { type: SchemaTypes.Number },
  type: { type: SchemaTypes.String },
  ip_address: { type: SchemaTypes.String }, // deposit, withraw
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

TransactionSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('Transaction', TransactionSchema);