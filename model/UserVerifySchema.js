const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const UserVerifySchema = new Schema({
  user_code: {
    type: SchemaTypes.String,
    index: true
  },
  token: { type: SchemaTypes.String },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

UserVerifySchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('UserVerify', UserVerifySchema);