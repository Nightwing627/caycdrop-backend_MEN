const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const PromoCodeSchema = new Schema({
  user_code: { type: SchemaTypes.String },
  promo_code: { type: SchemaTypes.String },
  status: { type: SchemaTypes.Boolean }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

PromoCodeSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('PromoCode', PromoCodeSchema);