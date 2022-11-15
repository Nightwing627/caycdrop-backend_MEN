const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;

const UserSeedSchema = new Schema({
  userId: { type: SchemaTypes.ObjectId },
  code: { type: SchemaTypes.String },
  client_seed: {
    type: SchemaTypes.ObjectId,
    ref: 'Seed'
  },
  server_seed: {
    type: SchemaTypes.ObjectId,
    ref: 'Seed'
  },
  next_server_seed: {
    type: SchemaTypes.ObjectId,
    ref: 'Seed'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

module.exports = mongoose.model('UserSeed', UserSeedSchema);