const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;

const BoxOpenSchema = new Schema({
  code: { type: SchemaTypes.String },
  user: {
    type: SchemaTypes.ObjectId,
    ref: 'User'
  },
  box: {
    type: SchemaTypes.ObjectId,
    ref: 'Box'
  },
  item: {
    type: SchemaTypes.ObjectId,
    ref: 'Item'
  },
  pvp_code: { type: SchemaTypes.String },
  user_item: {
    type: SchemaTypes.ObjectId,
    ref: 'UserCart'
  },
  cost: { type: SchemaTypes.Number },
  profit: { type: SchemaTypes.Number },
  xp_rewarded: { type: SchemaTypes.Number },
  roll_code: { type: SchemaTypes.String }, // roll history code
  status: { type: SchemaTypes.Boolean }  // true: process available, false: process ended 
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

module.exports = mongoose.model('BoxOpen', BoxOpenSchema);