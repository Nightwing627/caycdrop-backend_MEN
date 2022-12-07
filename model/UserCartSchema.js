const mongoose = require('mongoose')
const { Schema, SchemaTypes } = mongoose;

const UserCartSchema = new Schema({
  code: { type: SchemaTypes.String },
  user_code: { type: SchemaTypes.String },
  item_code: { type: SchemaTypes.String },
  status: { type: SchemaTypes.Number }
}, {
  timestamps: {
  	createdAt: 'created_at',
  	updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('UserCart', UserCartSchema);