const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;

const BoxItemSchema = new Schema({
  box_code: { type: SchemaTypes.String },
  item: {
    type: SchemaTypes.ObjectId,
    ref: 'Item'
  },
  rate: { type: SchemaTypes.Number },
  roll_start: { type: SchemaTypes.Number },
  roll_end: { type: SchemaTypes.Number },
  status: { type: SchemaTypes.Boolean } // true, false
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

module.exports = mongoose.model('BoxItem', BoxItemSchema);