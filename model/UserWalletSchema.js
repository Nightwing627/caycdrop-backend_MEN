const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const UserWalletSchema = new Schema({
  user_code: {
    type: SchemaTypes.String,
    index: true
  },
  main: { type: SchemaTypes.Number },
  main_currency: { 
    type: SchemaTypes.String,
    enum: ['USD', 'EUR', 'ETH', 'BTC', 'LTC', 'BCH', 'TKN'] 
  },
  bonus: { type: SchemaTypes.Number },
  bonus_currency: { 
    type: SchemaTypes.String,
    enum: ['USD', 'EUR', 'ETH', 'BTC', 'LTC', 'BCH', 'TKN']
  },
  affiliate_earning: { type: SchemaTypes.Number },
  affiliate_currency: {
    type: SchemaTypes.String,
    enum: ['USD', 'EUR', 'ETH', 'BTC', 'LTC', 'BCH', 'TKN']
  },
  gem_stone: { type: SchemaTypes.Number },
  gem_currency: {
    type: SchemaTypes.String,
    enum: ['USD', 'EUR', 'ETH', 'BTC', 'LTC', 'BCH', 'TKN']
  }
}, {
  timestamps: {
  	createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('UserWallet', UserWalletSchema);