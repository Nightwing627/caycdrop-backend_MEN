const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const TierSchema = new Schema({
  code: {
    type: SchemaTypes.String,
    index: true
  },
  commission: { type: SchemaTypes.Number },
  min_claim: { type: SchemaTypes.Number },
  min_active_claim: { type: SchemaTypes.Number },
  assignable: { type: SchemaTypes.Number },
  available_loan: { type: SchemaTypes.Number },
  required_deposit: { type: SchemaTypes.Number },
  currency: { type: SchemaTypes.String }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

TierSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('Tier', TierSchema);