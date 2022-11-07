const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const ForgetPasswordSchema = new Schema({
  user_code: { type: SchemaTypes.String },
  token: { type: SchemaTypes.String },
  password: { type: SchemaTypes.String },
  status: { type: SchemaTypes.String },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

ForgetPasswordSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('ForgetPassword', ForgetPasswordSchema);