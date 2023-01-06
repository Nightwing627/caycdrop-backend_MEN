const BoxSchema = require('../model/BoxSchema');
const ItemSchema = require('../model/ItemSchema');
const BoxItemSchema = require('../model/BoxItemSchema');
const CountrySchema = require('../model/CountrySchema');
const TagSchema = require('../model/TagSchema');
const TierSchema = require('../model/TierSchema');

const Util = require('../util');
const boxData = require('./boxes.json');
const itemData = require('./items.json');
const boxItemData = require('./boxItems.json');
const countryData = require('./country.json');
const tagData = require('./tags.json');
const tierData = require('./tiers.json');

const init = async () => {
  const boxs = await BoxSchema.find();
  if (boxs == null || boxs.length == 0) {
    await BoxSchema.insertMany(boxData);
  }

  const items = await ItemSchema.find();
  if (items == null || items.length == 0) {
    await ItemSchema.insertMany(itemData);
  }

  const tiers = await TierSchema.find();
  if (tiers == null || tiers.length == 0) {
    await TierSchema.insertMany(tierData);
  }
  
  // const boxItems = await BoxItemSchema.find();
  // if (boxItems == null || boxItems.length == 0) {
  //   await BoxItemSchema.insertMany(boxItemData);
  // }

  // const countries = await CountrySchema.find();
  // if (countries == null || countries.length == 0) {
  //   await CountrySchema.insertMany(countryData);
  // }

  // const tags = await TagSchema.find();
  // if (tags == null || tags.length == 0) {
  //   await TagSchema.insertMany(tagData);
  // }

  // tags.forEach(async item => {
  //   if (item.code == null) {
  //     item.code = Util.generateCode('tag', item._id);
  //     await item.save();  
  //   }
  // })
}

module.exports = {
  init
};