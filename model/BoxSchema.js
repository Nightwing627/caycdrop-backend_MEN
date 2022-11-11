const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const BoxSchema = new Schema({
  ancestor_box: { type: SchemaTypes.ObjectId },
  code: { type: SchemaTypes.String },
  name: { type: SchemaTypes.String },
  cost: { type: SchemaTypes.Number },
  original_price: { type: SchemaTypes.Number },
  currency: { type: SchemaTypes.String },
  icon: { type: SchemaTypes.String },
  level_required: { type: SchemaTypes.Number },
  tags: [{
    type: SchemaTypes.ObjectId,
    ref: 'Tag'
  }],
  max_purchase_daily: { type: SchemaTypes.Number },
  purchasable: { type: SchemaTypes.Boolean },
  sellable: { type: SchemaTypes.Boolean },
  openable: { type: SchemaTypes.Boolean },
  slug: { type: SchemaTypes.String },
  markets: [{
    type: SchemaTypes.ObjectId,
    ref: 'Market'
  }],
  description: { type: SchemaTypes.String },
  enable: { type: SchemaTypes.Boolean },
  background_image: {
    type: SchemaTypes.ObjectId,
    ref: 'Asset'
  },
  order: { type: SchemaTypes.Number },
  statistic: {
    type: SchemaTypes.ObjectId,
    'ref': 'BoxStatistics'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

BoxSchema.virtual('virSort').get(function () {
  return Math.round(this.original_price);
});

BoxSchema.set('toObject', { virtuals: true });

BoxSchema.set('toJSON', { virtuals: true });

BoxSchema.plugin(uniqueValidator, { message: " is already taken " });

module.exports = mongoose.model('Box', BoxSchema);