const mongoose = require('mongoose')
const { Schema, SchemaTypes } = mongoose;

const UserCartSchema = new Schema({
  user_code: { type: SchemaTypes.String },
  item_code: { type: SchemaTypes.String },
  status: { type: SchemaTypes.Number }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserCart', UserCartSchema);