const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const AffliateTxsSchema = new Schema({
  code: {
    type: SchemaTypes.String,
    index: true
  },
  user_code: { type: SchemaTypes.String },
  txs: {
    type: SchemaTypes.ObjectId,
    ref: 'Transaction'
  },
  promo: {
    type: SchemaTypes.ObjectId,
    ref: 'PromoCode'
  },
  status: { type: SchemaTypes.String }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

AffliateTxsSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('AffliateTransaction', AffliateTxsSchema);