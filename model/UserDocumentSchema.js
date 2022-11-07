const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const UserDocumentSchema = new Schema({
  user_code: {
    type: SchemaTypes.String,
    index: true
  },
  doc_type: { type: SchemaTypes.String },
  file_path1: { type: SchemaTypes.String },
  file_path2: { type: SchemaTypes.String },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

UserDocumentSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('UserDocument', UserDocumentSchema);