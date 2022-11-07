const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const UserShippingInfoSchema = new Schema({
  user_code: {
    type: SchemaTypes.String,
    index: true
  },
  first_name: { type: SchemaTypes.String },
  last_name: { type: SchemaTypes.String },
  address: { type: SchemaTypes.String },
  address2: { type: SchemaTypes.String },
  zipcode: { type: SchemaTypes.String },
  state: { type: SchemaTypes.String },
  city: { type: SchemaTypes.String },
  country: {
    type: SchemaTypes.ObjectId,
    ref: 'Country'
  },
  phone: { type: SchemaTypes.String },
  birthday: { type: SchemaTypes.Date },
  gender: {
    type: SchemaTypes.String,
    enum: [ 'male', 'female' ],
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

UserShippingInfoSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('UserShippingInfo', UserShippingInfoSchema);