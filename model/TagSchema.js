const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const TagSchema = new Schema({
  code: {
    type: SchemaTypes.String,
    index: true
  },
  name: { type: SchemaTypes.String },
  color: { type: SchemaTypes.String },
  icon: { type: SchemaTypes.String },
  visible: { type: SchemaTypes.Boolean },
  position: { type: SchemaTypes.String },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

TagSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('Tag', TagSchema);