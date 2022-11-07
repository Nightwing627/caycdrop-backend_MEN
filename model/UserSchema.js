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
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

UserSchema.plugin(uniqueValidator, 'is already registered');

module.exports = mongoose.model('User', UserSchema);