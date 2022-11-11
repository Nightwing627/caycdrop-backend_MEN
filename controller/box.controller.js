const TagSchema = require('../model/TagSchema');
const BoxSchema = require('../model/BoxSchema');
const BoxOpenSchema = require('../model/BoxOpenSchema');
const BoxStatisticsSchema = require('../model/BoxStatisticsSchema');

const orders = [
  { value: 'recommend', label: 'Recommended'},
  { value: 'm_open', label: 'Most Opened Boxes'}, // sort box opening count
  { value: 'l_open', label: 'Leaset Opened Boxes'},
  { value: 'm_popular', label: 'Most Popular'},   // sort box setted in battle
  { value: 'l_popular', label: 'Least Popular'},
  { value: 'p_to_high', label: 'Price(Low to High)'},
  { value: 'p_to_low', label: 'Price(High to low)'},
  { value: 'new', label: 'Newest'},
  { value: 'old', label: 'Oldest'}
]

const BoxController = {
  getFilterData: async (req, res) => {
    // visible tag list
    const tags = await TagSchema.find({ visible: true }, { _id: 0, __v: 0 });
    res.status(200).json({
      tags, orders
    })
  },

  getAllData: async (req, res) => {
    const {
      _q = '',
      _sort = 'recommend',
      _page = 1,
      _size = 50
    } = req.query;

    const defaultTag = await TagSchema.findOne({ name: 'featured' });
    
    const options = { sort: [["statistic.opened", 'asc']] };

    const data = await BoxSchema
      .find({
        $or: [
          { tags: defaultTag._id },
          { name: { $regex: '.*' + _q + '.*', $options: 'i' } }
        ]
      })
      .populate('statistic')
      .select('-_id')
      .limit(_size * 1)
      .skip((_page - 1) * _size)
      .sort({ "statistic.opened": -1 })
      .exec();
    
    console.log(data.length);
    
    // data.sort((a, b) => {
    //   console.log(a);
    // });
      // .populate('tags', '-_id')
      //.populate('statistic', 'opened popular -_id', null, { sort: { 'popular': -1 } });
    res.status(200).json(data);
  },

  getBoxBySlug: async (req, res) => {

  }
};

module.exports = BoxController;