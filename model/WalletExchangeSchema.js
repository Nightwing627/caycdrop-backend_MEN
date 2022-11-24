const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const WalletExchangeSchema = new Schema({
  code: {
    type: SchemaTypes.String,
    index: true
  },
  user: {
    type: SchemaTypes.ObjectId,
    ref: 'User'
  },
  type: {
    type: SchemaTypes.String,
    enum: [
      process.env.WALLET_EXCHANGE_ITEM,
      process.env.WALLET_EXCHANGE_BOX,
      process.env.WALLET_EXCHANGE_PVP
    ],
  },
  value_change: { type: SchemaTypes.Number },
  changed_after: { type: SchemaTypes.Number },
  wallet: {
    type: SchemaTypes.ObjectId,
    ref: 'UserWallet',
  },
  currency: { type: SchemaTypes.String },
  target: { type: SchemaTypes.ObjectId },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

WalletExchangeSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('WalletExchange', WalletExchangeSchema);