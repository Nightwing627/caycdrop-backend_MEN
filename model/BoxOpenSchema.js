const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;

const BoxOpenSchema = new Schema({
  user: {
    type: SchemaTypes.ObjectId,
    ref: 'User'
  },
  box: {
    type: SchemaTypes.ObjectId,
    ref: 'Box'
  },
  cost: { type: SchemaTypes.Number },
  profit: { type: SchemaTypes.Number },
  xp_rewarded: { type: SchemaTypes.Number },
  roll_code: { type: SchemaTypes.String } // TODO: assign the Roll collection
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

module.exports = mongoose.model('BoxOpen', BoxOpenSchema);