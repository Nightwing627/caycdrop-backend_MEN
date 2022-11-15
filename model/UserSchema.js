const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator');
const { Schema, SchemaTypes } = mongoose;

const UserSchema = new Schema({
  code: { type: SchemaTypes.String, index: true },
  email: {
    type: SchemaTypes.String,
    required: [true, ' can\'t be blank'],
    unique: [true, ' is already exist'],
    lowercase: [true, ' is must be lowercase'],
    match: [/\S+@\S+\.\S+/, "is invalid"],
    index: true,
  },
  password: {
    type: SchemaTypes.String,
    required: true,
  },
  token: {
    type: SchemaTypes.String,
    required: true,
  },
  refresh_token: { type: SchemaTypes.String },
  is_subscribe: { type: SchemaTypes.Boolean },
  is_termsService: { type: SchemaTypes.Boolean },
  email_verify: { type: SchemaTypes.Boolean },
  steam_id: { type: SchemaTypes.String },
  steam_apiKey: { type: SchemaTypes.String },
  account: {
    type: SchemaTypes.ObjectId,
    ref: 'Account'
  },
  user_progress: {
    type: SchemaTypes.ObjectId,
    ref: 'UserProgress'
  },
  wallets: {
    type: SchemaTypes.ObjectId,
    ref: 'UserWallet'
  },
  shipping_info: {
    type: SchemaTypes.ObjectId,
    ref: 'UserShippingInfo'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

UserSchema.plugin(uniqueValidator, 'is already registered');

UserSchema.methods.toAuthJSON = function () {
  return {
    code: this.code,
    email: this.email,
    isSubscribe: this.is_subscribe,
    isTOS: this.is_termsService,
    emailVerify: this.email_verify,
    steamId: this.steam_id,
    steamApiKey: this.steamApiKey,
    account: this.account,
    userProgress: this.user_progress,
    wallets: this.wallets,
    shippingInfo: this.shipping_info
  }
}

module.exports = mongoose.model('User', UserSchema);