const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const { Schema, SchemaTypes } = mongoose;

const UserProgressSchema = new Schema({
  user_code: {
    type: SchemaTypes.String,
    index: true
  },
  xp: { type: SchemaTypes.Number },
  required_xp: { type: SchemaTypes.Number },
  next_required_xp: { type: SchemaTypes.Number },
  level: { type: SchemaTypes.Number },
  bet_count: { type: SchemaTypes.Number },
  updated_at: { type: SchemaTypes.Date },
}, {
  timestamps: false
});

UserProgressSchema.plugin(uniqueValidator, { message: 'is already taken' });

module.exports = mongoose.model('UserProgress', UserProgressSchema);