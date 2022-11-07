const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const SettingSchema = new Schema({
  code: {
    type: SchemaTypes.String,
    index: true
  },
  key: { type: SchemaTypes.String },
  value: { type: SchemaTypes.String },
  type: { type: SchemaTypes.String },
  description: { type: SchemaTypes.String },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

SettingSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('Setting', SettingSchema);