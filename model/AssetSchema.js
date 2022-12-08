const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;

const AssetSchema = new Schema({
  path: { type: SchemaTypes.String },
  description: { type: SchemaTypes.String },
  background_color: { type: SchemaTypes.String },
  mime_type: { type: SchemaTypes.String },
}, {
  timestamps: {
  	createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Asset', AssetSchema);