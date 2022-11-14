const TagSchema = require('../model/TagSchema');
const BoxSchema = require('../model/BoxSchema');
const ItemSchema = require('../model/ItemSchema');
const BoxItemSchema = require('../model/BoxItemSchema');
const SeedSchema = require('../model/SeedSchema');

const Util = require('../util');
const tagData = require('./tag.json');
const boxData = require('./box');
const itemData = require('./item');
const boxItemData = require('./boxItem');
const seedData = require('./seed.json');

const init = async () => {
  
  const tags = await TagSchema.find();
  if (tags == null || tags.length == 0) {
    await TagSchema.insertMany(tagData);
  }

  const boxs = await BoxSchema.find();
  if (boxs == null || boxs.length == 0) {
    await BoxSchema.insertMany(boxData);
  }

  const items = await ItemSchema.find();
  if (items == null || items.length == 0) {
    await ItemSchema.insertMany(itemData);
  }

  const boxItems = await BoxItemSchema.find();
  if (boxItems == null || boxItems.length == 0) {
    await BoxItemSchema.insertMany(boxItemData);
  }

  const seeds = await SeedSchema.find();
  if (seeds == null || seeds.length == 0) {
    await SeedSchema.insertMany(seedData);
  }
  // boxs.forEach(async item => {
  //   item.opened = Math.floor(Math.random() * 500);
  //   item.popular = Math.floor(Math.random() * 500);
  //   await item.save();
  // })
}

module.exports = init;