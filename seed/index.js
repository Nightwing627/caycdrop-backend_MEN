const TagSchema = require('../model/TagSchema');
const BoxSchema = require('../model/BoxSchema');
const Util = require('../util');
const tagData = require('./tag.json');
const boxData = require('./box');

const init = async () => {
  
  const tags = await TagSchema.find();
  if (tags == null || tags.length == 0) {
    await TagSchema.insertMany(tagData);
  }
  tags.forEach( async item => {
    item.code = Util.generateCode('tag', item._id);
    await item.save();
  });

  const boxs = await BoxSchema.find();
  if (boxs == null || boxs.length == 0) {
    await BoxSchema.insertMany(boxData)
  }
  boxs.forEach(async item => {
    item.code = Util.generateCode('box', item._id);
    await item.save();
  })
}

module.exports = init;