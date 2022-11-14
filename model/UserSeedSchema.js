const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;

const UserSeedSchema = new Schema({
  userId: { type: SchemaTypes.ObjectId },
  code: { type: SchemaTypes.String },
  value: { type: SchemaTypes.String },
  hashed: { type: SchemaTypes.String },
  server_value: { type: SchemaTypes.String },
  server_hashed: { type: SchemaTypes.String },
  pre_seed: {
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