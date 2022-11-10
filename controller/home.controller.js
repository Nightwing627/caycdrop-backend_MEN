const BoxSchema = require('../model/BoxSchema');
const BoxOpenSchema = require('../model/BoxSchema');
const TagSchema = require('../model/TagSchema');

const HomeController = {
  index: async (req, res) => {
    // TODO: get live drop items - socket
    const tag = await TagSchema.findOne({ name: 'featured' });

    let featureBoxs = await BoxSchema
      .find({ tags: tag._id })
      .populate('tags', '-_id')
      // .populate('markets')
      // .populate('background_image')
      .sort({ 'tagLength': -1 })
      .limit(24)
      .select('-_id')
      .exec();
    
    return res.status(200).json(featureBoxs)
  },

  getFooterData: async (req, res) => {

  }
}

module.exports = HomeController;