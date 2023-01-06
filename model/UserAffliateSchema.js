const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const UserAffliateSchema = new Schema({
  user_code: { type: SchemaTypes.String },
  level: { type: SchemaTypes.Number },
  tier: {
    type: SchemaTypes.ObjectId,
    ref: 'Tier'
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

UserAffliateSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('UserAffliate', UserAffliateSchema);