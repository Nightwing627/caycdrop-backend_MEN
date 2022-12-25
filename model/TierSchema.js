const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const TagSchema = new Schema({
  code: {
    type: SchemaTypes.String,
    index: true
  },
  commission: { type: SchemaTypes.Number },
  min_claim: { type: SchemaTypes.Number },
  min_active_claim: { type: SchemaTypes.Number },
  code_count: { type: SchemaTypes.Number },
  available_loan: { type: SchemaTypes.Number },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

TagSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('Tag', TagSchema);