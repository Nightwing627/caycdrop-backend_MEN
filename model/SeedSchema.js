const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;

const SeedSchema = new Schema({
  code: { type: SchemaTypes.String },
  type: {
    type: SchemaTypes.String,
    enum: [
      process.env.SEED_TYPE_CLIENT,
      process.env.SEED_TYPE_SERVER
    ]
  },
  future: { type: SchemaTypes.Boolean },
  value: { type: SchemaTypes.String },
  hash: { type: SchemaTypes.String },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

module.exports = mongoose.model('Seed', SeedSchema);