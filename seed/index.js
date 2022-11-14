const TagSchema = require('../model/TagSchema');
const BoxSchema = require('../model/BoxSchema');
const ItemSchema = require('../model/ItemSchema');
const BoxItemSchema = require('../model/BoxItemSchema');
const SeedSchema = require('../model/SeedSchema');
const RollHistorySchema = require('../model/RollHistorySchema');
const BoxOpenSchema = require('../model/BoxOpenSchema');
const UserSchema = require('../model/UserSchema');

const Util = require('../util');
const tagData = require('./tag.json');
const boxData = require('./box');
const itemData = require('./item');
const boxItemData = require('./boxItem');
const seedData = require('./seed.json');
const rollData = require('./rollHistory');
const boxOpenData = require('./boxOpen')

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

  const rollHistory = await RollHistorySchema.find();
  if (rollHistory == null || rollHistory.length == 0) {
    await RollHistorySchema.insertMany(rollData);
  }

  const boxOpens = await BoxOpenSchema.find();
  if (boxOpens == null || boxOpens.length == 0) {
    await BoxOpenSchema.insertMany(boxOpenData);
  }

  // boxs.forEach(async item => {
  //   item.opened = Math.floor(Math.random() * 500);
  //   item.popular = Math.floor(Math.random() * 500);
  //   await item.save();
  // })

  // boxs.forEach(async item => {
  //   item.code = Util.generateCode('item', item._id);
  //   await item.save();
  // })
}

module.exports = init;