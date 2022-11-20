const TagSchema = require('../model/TagSchema');
const BoxSchema = require('../model/BoxSchema');
const BoxOpenSchema = require('../model/BoxOpenSchema');
const BoxStatisticsSchema = require('../model/BoxStatisticsSchema');
const BoxItemSchema = require('../model/BoxItemSchema');
const Util = require('../util');

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
      _q,
      _sort = 'recommend',
      _page = 1,
      _size = 50,
      _tag
    } = req.body;
    
    const sort = _sort ? _sort : 'recommend';
    const page = Number(_page) ? Number(_page) : 1;
    const size = Number(_size) ? Number(_size) : 50;
    const search = _q ? _q : '';

    try {
      let tagFilter;
      if (_tag) {
        tagFilter = await TagSchema.findOne({ code: _tag });
      } else {
        tagFilter = await TagSchema.findOne({ name: 'featured' })
      }
      
      console.log(sort, page, size, _tag, '1111111111')

      let aggreSort;
      if (sort == 'recommend') {
        aggreSort = [
          {
            $addFields: { "recommend": { $sum: ["$opened", "$popular"] } }
          },
          {
            $sort: { "recommend": -1 }
          }
        ];
      } else if (_sort == 'm_open') {
        aggreSort = [{ $sort: { "opened": -1 } }];
      } else if (_sort == 'l_open') {
        aggreSort = [{ $sort: { "opened": 1 } }];
      } else if (_sort == 'm_popular') {
        aggreSort = [{ $sort: { "popular": -1 } }];
      } else if (_sort == 'l_popular') {
        aggreSort = [{ $sort: { "popular": 1 } }];
      } else if (_sort == 'p_to_high') {
        aggreSort = [{ $sort: { "original_price": -1 } }];
      } else if (_sort == 'p_to_low') {
        aggreSort = [{ $sort: { "original_price": 1 } }];
      } else if (_sort == 'new') {
        aggreSort = [{ $sort: { "created_at": -1 } }];
      } else if (_sort == 'old') {
        aggreSort = [{ $sort: { "created_at": 1 } }];
      } else {
        aggreSort = [
          {
            $addFields: { "recommend": { $sum: ["$opened", "$popular"] } }
          },
          {
            $sort: { "recommend": -1 }
          }
        ];
      }

      let data = await BoxSchema.aggregate([
        {
          $match: {
            $or: [
              { name: { $regex: '.*' + search + '.*', $options: 'i' } },
              { tags: tagFilter._id }
            ]
          }
        },
        {
          $lookup: {
            from: 'tags',
            localField: 'tags',
            foreignField: '_id',
            as: 'tags'
          }
        },
        ...aggreSort,
        {
          $project: {
            _id: 0, ancestor_box: 1, code: 1, name: 1, cost: 1, original_price: 1,
            currency: 1, icon: 1, level_required: 1, order: 1,
            "tags.code": 1, "tags.name": 1, "tags.visible": 1, "tags.color": 1
          }
        },
        { $skip: (page - 1) * size },
        { $limit: size }
      ]);

      // TODO: live drop items socket
      res.status(200).json({ data });
    } catch (error) {
      res.status(200).json({ data: [] });
    }
  },

  getBoxBySlug: async (req, res) => {
    const slug = req.params.slug || '';

    try {
      const box = await BoxSchema
        .findOne({ slug })
        .populate('tags', '-_id -__v -created_at -updated_at')
        .populate('markets', '-_id');      
      
      if (!box) {
        return res.status(400).json({
          error: 'box not found'
        });
      }
      
      let boxItems = await BoxItemSchema
        .find({ box_code: box.code })
        .populate({
          path: 'item',
          populate: {
            path: 'category',
            select: '-_id -__v -created_at -updated_at'
          },
          select: '-_id -__v -created_at -updated_at'
        })
        .select('-_id -__v -created_at -updated_at');
      
      boxItems = Util.setBoxItemRolls(boxItems);
      let data = {
        ...box.toGetOneJSON(),
        slots: boxItems
      };
    
      return res.status(200).json({ data });  
    } catch (error) {
      return res.status(400).json({
        error: 'not found'
      });
    }
  },

  getRecommendedBoxs: async (req, res) => {
    try {
      return res
        .status(200)
        .json({
          data: await getSuggestBoxs(req.params._page, req.params._size)
        })
    } catch (error) {
      return res.status(200).json({ data: [] });
    }
  },

  getBoxTopOpen: async (req, res) => {
    const slug = req.params.slug || '';
    try {
      const boxSrc = await BoxSchema.findOne({ slug });
      
      const data = await BoxOpenSchema
        .find({ box: boxSrc._id })
        .populate({
          path: 'user',
          select: '-_id code',
          populate: [
            {
              path: 'account',
              select: '-_id username g_rank avatar is_authentic'
            },
            {
              path: 'user_progress',
              select: '-_id level'
            }
          ]
        })
        .populate('box', '-_id code name slug icon cost currency')
        .populate('item', '-_id code name icon_url rarity value currency type')
        .select('-_id -__v')
        .limit(20)
        .sort({ profit: 1 });
      
      const result = [];

      data.forEach(item => {
        result.push({
          code: item.code,
          cost: item.cost,
          profit: item.profit,
          user: {
            code: item.user.code,
            username: item.user.account.username,
            g_rank: item.user.account.g_rank,
            avatar: item.user.account.avatar,
            is_authentic: item.user.account.is_authentic,
            level: item.user.user_progress.level,
          },
          box: item.box,
          item: item.item,
          xpRewarded: item.xp_rewarded,
          pvpCode: item.pvp_code,
          roll: item.roll_code,
          createdAt: item.created_at,
          updatedAt: item.updatedAt,
        });
      });
      
      
      return res.status(200).json({ result });
    } catch (err) {
      console.log(err);
      return res.status(400).json({ error: 'no data'});
    }
  }
};

const getSuggestBoxs = async (_page = 1, _size = 50) => {
  let data = await BoxSchema.aggregate([
    {
      $lookup: {
        from: 'tags',
        localField: 'tags',
        foreignField: '_id',
        as: 'tags'
      }
    }, {
      $addFields: { "recommend": { $sum: ["$opened", "$popular"] } }
    }, {
      $sort: { "recommend": -1 }
    }, {
      $project: {
        _id: 0, ancestor_box: 1, code: 1, name: 1, cost: 1, original_price: 1,
        currency: 1, icon: 1, level_required: 1, order: 1,
        "tags.code": 1, "tags.name": 1, "tags.visible": 1, "tags.color": 1
      }
    },
    { $skip: (_page - 1) * _size },
    { $limit: _size }
  ]);

  return data;
}

module.exports = BoxController;