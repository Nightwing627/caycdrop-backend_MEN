const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;

const SeedSchema = new Schema({
  code: { type: SchemaTypes.String },
  value: { type: SchemaTypes.String },
  hashed: { type: SchemaTypes.String },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

module.exports = mongoose.model('Seed', SeedSchema);