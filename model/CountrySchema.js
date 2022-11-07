const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const CountrySchema = new Schema({
  code: {
    type: SchemaTypes.String,
    index: true
  },
  name: { type: SchemaTypes.String },
  dial_code: { type: SchemaTypes.String },
}, {
  timestamps: false,
});

CountrySchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('Country', CountrySchema);