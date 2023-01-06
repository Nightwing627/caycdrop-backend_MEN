const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const OrderPromoSchema = new Schema({
  user_code: {
    type: SchemaTypes.String,
    index: true
  },
  user_promo: {
    type: SchemaTypes.ObjectId,
    ref: 'PromoCode'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

OrderPromoSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('OrderPromo', OrderPromoSchema);