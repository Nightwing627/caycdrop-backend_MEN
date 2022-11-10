const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const UserTagSchema = new Schema({
  user_code: { type: SchemaTypes.String },
  tag: { type: SchemaTypes.Number },
  status: {
    type: SchemaTypes.String,
    enum: [process.env.USER_TAG_STATUS_USED, process.env.USER_TAG_STATUS_CHANGED]
  },
}, {
  timestamps: false
});

UserTagSchema.plugin(uniqueValidator, { message: "is ready taken" });

module.exports = mongoose.model('UserTag', UserTagSchema);