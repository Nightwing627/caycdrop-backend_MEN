const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;

const RollHistorySchema = new Schema({
  code: { type: SchemaTypes.String },
  value: { type: SchemaTypes.Number },
  nonce: { type: SchemaTypes.Number },
  game: {
    type: SchemaTypes.String,
    enum: ['BOX', 'PVP']
  },
  server_seed: {
    type: SchemaTypes.ObjectId,
    ref: 'Seed'
  },
  client_seed: {
    type: SchemaTypes.ObjectId,
    ref: 'Seed'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

module.exports = mongoose.model('RollHistory', RollHistorySchema);