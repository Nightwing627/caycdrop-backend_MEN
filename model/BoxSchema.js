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
  icon_path: { type: SchemaTypes.String },
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
  /// statistic data
  opened: { type: SchemaTypes.Number },	// amount of unboxing
  popular: { type: SchemaTypes.Number } // picked count in battle
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

BoxSchema.set('toObject', { virtuals: true });

BoxSchema.set('toJSON', { virtuals: true });

BoxSchema.methods.toListJSON = function () {
  return {
    ancestor_box: this.ancestor_box,
    code: this.code,
    name: this.name,
    cost: this.cost,
    originalPrice: this.original_price,
    currency: this.currency,
    icon: `${process.env.LINK}/${this.icon_path}`,
    levelRequired: this.level_required,
    tags: this.tags,
    order: this.order,
  }
};

BoxSchema.methods.toGetOneJSON = function () {
  return {
    ancestorBox: this.ancestor_box,
    code: this.code,
    name: this.name,
    cost: this.cost,
    originalPrice: this.original_price,
    currency: this.currency,
    icon: `${process.env.LINK}/${this.icon_path}`,
    levelRequired: this.level_required,
    tags: this.tags,
    maxPurchaseDaily: this.max_purchase_daily,
    purchasable: this.purchasable,
    sellable: this.sellable,
    openable: this.openable,
    slug: this.slug,
    markets: this.markets,
    description: this.description,
    enable: this.enable,
    bgImage: this.background_image,
    order: this.order,
  }
};

BoxSchema.virtual('icon').get(function () {
  return `${process.env.LINK}/${this.icon_path}`;
});

  
BoxSchema.plugin(uniqueValidator, { message: " is already taken " });

module.exports = mongoose.model('Box', BoxSchema);