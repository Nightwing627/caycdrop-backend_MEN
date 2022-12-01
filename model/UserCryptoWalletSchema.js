const mongoose = require('mongoose')
const { Schema, SchemaTypes } = mongoose;

const UserCryptoWalletSchema = new Schema({
  user_code: { type: SchemaTypes.String },
  eth_address: { type: SchemaTypes.String },
  eth_privateKey: { type: SchemaTypes.String },
  eth_index: { type: SchemaTypes.Number },
  eth_status: { type: SchemaTypes.Boolean },

  btc_address: { type: SchemaTypes.String },
  btc_privateKey: { type: SchemaTypes.String },
  btc_index: { type: SchemaTypes.Number },
  btc_status: { type: SchemaTypes.Boolean },

  ltc_address: { type: SchemaTypes.String },
  ltc_privateKey: { type: SchemaTypes.String },
  ltc_index: { type: SchemaTypes.Number },
  ltc_status: { type: SchemaTypes.Boolean },

  bch_address: { type: SchemaTypes.String },
  bch_privateKey: { type: SchemaTypes.String },
  bch_index: { type: SchemaTypes.Number },
  bch_status: { type: SchemaTypes.Boolean },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

UserCryptoWalletSchema.methods.toGetJSON = function() {
	return {
		userCode: this.user_code,
		ethWallet: this.eth_address,
		btcWallet: this.btc_address,
		ltcWallet: this.ltc_address,
		bchWallet: this.bch_address
	}
}

module.exports = mongoose.model('UserCryptoWallet', UserCryptoWalletSchema);