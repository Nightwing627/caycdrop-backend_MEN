const TagSchema = require('../model/TagSchema');
const BoxSchema = require('../model/BoxSchema');
const BoxOpenSchema = require('../model/BoxOpenSchema');
const BoxStatisticsSchema = require('../model/BoxStatisticsSchema');
const BoxItemSchema = require('../model/BoxItemSchema');
const Util = require('../util');
const UserSchema = require('../model/UserSchema');
const UserWalletSchema = require('../model/UserWalletSchema');
const UserProgressSchema = require('../model/UserProgressSchema');
const UserSeedSchema = require('../model/UserSeedSchema');
const crypto = require('crypto');
const RollHistorySchema = require('../model/RollHistorySchema');
const UserCartSchema = require('../model/UserCartSchema');
const WalletExchangeSchema = require('../model/WalletExchangeSchema');

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
    // const tags = await TagSchema.find({ visible: true }, { _id: 0, __v: 0 });
    const tags = await TagSchema
      .find({ visible: true })
      .select({ _id: 0, __v: 0 });

    res.status(200).json({
      tags, orders
    })
  },

  getAllData: async (req, res) => {
    const { _q, _sort, _page, _size, _tag } = req.body;

    const sort = _sort ? _sort : 'recommend';
    const page = Number(_page) ? Number(_page) : 1;
    const size = Number(_size) ? Number(_size) : 50;
    const search = _q ? _q : '';

    try {

      let conditions;
      let nameMatch, tagMatch, aggreSort;
      
      nameMatch = { name: { $regex: '.*' + search + '.*', $options: 'i' } };
      tagMatch = await getTagMatch(_tag);
      aggreSort = getSortField(sort);

      conditions = nameMatch;

      if (tagMatch && tagMatch.or) {
        conditions = { $or: [nameMatch, tagMatch.filter] };
      } else if (tagMatch && !tagMatch.or) {
        conditions = { $and: [nameMatch, tagMatch.filter] };
      }

      let data = await BoxSchema.aggregate([
        { $match: conditions },
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
            $addFields: { "icon": { $concat: [`${process.env.LINK}/`, "$icon_path"] } }
        },
        {
          $project: {
            _id: 0, ancestor_box: 1, code: 1, name: 1, cost: 1, original_price: 1,
            currency: 1, icon: 1, level_required: 1, order: 1, slug: 1,
            "tags.code": 1, "tags.name": 1, "tags.visible": 1, "tags.color": 1
          }
        },
        { $skip: (page - 1) * size },
        { $limit: size }
      ]);

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
      
      let boxItems = await BoxItemSchema.aggregate([
        { $match: { box_code: box.code } },
        {
          $project: {
            _id: 0, __v: 0, created_at: 0, updated_at: 0
          }
        },
        {
          $lookup: {
            from: 'items',
            localField: 'item',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: 0, updated_at: 0
                }
              }, {
                $lookup: {
                  from: 'tags',
                  localField: 'category',
                  foreignField: '_id',
                  pipeline: [
                    {
                      $project: { _id: 0, __v: 0, created_at: 0, updated_at: 0 }
                    }
                  ],
                  as: 'category'
                }
              }
            ],
            as: 'item',
          },
        },
        { $unwind: { path: "$item"} },
        {
          $sort: { "item.value": -1 }
        }
      ]);
      
      boxItems = Util.setBoxItemRolls(boxItems);
      let data = {
        ...box.toGetOneJSON(),
        slots: boxItems
      };
    
      return res.status(200).json({ data });  
    } catch (error) {
      console.log(error)
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
        .find({ box: boxSrc._id }, { status: false })
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
          box: item.box.toListJSON(),
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
      return res.status(400).json({ error: 'No data'});
    }
  },

  verifyBoxStatus: async (req, res) => {
    const { usercode, boxcode } = req.body;

    if (!(usercode && boxcode)) {
      return res.status(400).json({ error: "Params must be filled" });
    }
    // validate params
    const user = await UserSchema.findOne({ code: usercode });
    if (user == null) {
      return res.status(400).json({ error: "User doesn't exist" });
    }

    const box = await BoxSchema.findOne({ code: boxcode });
    if (box == null) {
      return res.status(400).json({ error: "Wrong box info" });
    }

    // get basic information for verifying
    const userWallet = await UserWalletSchema.findById(user.wallets);
    let userProgress = await UserProgressSchema.findById(user.user_progress);
    
    // compare user wallet and box cost
    if (userWallet.main < box.original_price) {
      return res.status(400).json({ error: "Please check your balance. it must be greater than bet" });
    }

    // get verify box roll value
    const userSeed = await UserSeedSchema
      .findOne({ userId: user._id })
      .populate('client_seed').populate('server_seed');

    const nonce = userProgress.bet_count;
    const max = Number(process.env.ROLL_MAX);
    const combined = [
      process.env.COMBINE_SEED_BOX,
      userSeed.server_seed.value,
      userSeed.client_seed.hash,
      nonce
    ].join('-');

    let hashed = crypto.createHmac('sha3-256', combined).digest('hex');
    hashed = Math.floor(Math.random() * Number(process.env.VERIFY_SEED_LEN))
      + hashed.slice(0, Number(process.env.VERIFY_SEED_LEN));
    const valueFromHash = Number.parseInt(hashed, 16);
    const verifyValue = Math.floor(valueFromHash / Math.pow(2, 52) * max);
    
    // get item data
    const itemData = await Util.getItemAndXP(box.code, verifyValue);
    const rollData = await RollHistorySchema.create({
      value: verifyValue,
      nonce,
      game: process.env.GAME_BOX,
      server_seed: userSeed.server_seed,
      client_seed: userSeed.client_seed
    });
    await RollHistorySchema.findByIdAndUpdate(rollData._id, {
      code: Util.generateCode('rollhistory', rollData._id)
    });

    const cart = await UserCartSchema.create({
      user_code: user.code,
      item_code: itemData.code,
      status: true,
    });
    await UserCartSchema.findByIdAndUpdate(cart._id, {
      code: Util.generateCode('usercart', cart._id)
    });

    // box history
    let boxOpen = await BoxOpenSchema.create({
      user: user._id,
      box: box._id,
      item: itemData.item._id,
      pvp_code: null,
      user_item: cart._id,
      cost: box.original_price,
      profit: Number(itemData.profit.toFixed(2)),
      xp_rewarded: itemData.xp,
      roll_code: rollData.code,
      status: true
    });
    boxOpen.code = Util.generateCode('boxopen', boxOpen._id);
    await boxOpen.save();

    // Wallet Exchange History
    const walletExchange = await WalletExchangeSchema.create({
      user: user._id,
      type: process.env.WALLET_EXCHANGE_BOX,
      value_change: box.original_price,
      changed_after: userWallet.main - box.original_price,
      wallet: userWallet._id,
      currency: 'USD',
      target: box._id
    });
    walletExchange.code = Util.generateCode('walletexchange', walletExchange._id);
    await walletExchange.save();

    box.opened += 1; await box.save();

    // user progress
    userProgress.bet_count += 1;
    if (itemData.xp) { 
      userProgress = Util.updateUserProgress(userProgress, itemData.xp);
    }
    await userProgress.save();
    
    // user wallet
    await UserWalletSchema.findByIdAndUpdate(userWallet._id, {
      main: userWallet.main - box.original_price
    });

    return res.status(200).json({ result: 'success', data: { verifyValue, box: boxOpen.code } });
  }
};

const getTagMatch = async (_tag) => {
  if (_tag == null || _tag == '')
    return null;
  
  const tag = await TagSchema.findOne({ code: _tag });
  if (tag == null) return null;
  if (tag.name == 'Featured') {
    return { or: true, filter: { tags: tag._id } };
  } else {
    return { or: false, filter: { tags: tag._id } };
  }
}

const getSortField = (sort) => {
  let sortPart = [
    { $addFields: { "recommend": { $sum: ["$opened", "$popular"] } } },
    { $sort: { "recommend": -1 } }
  ]

  if (sort == 'm_open') {
    sortPart = [ { $sort: { "opened": -1 } } ];
  } else if (sort == 'l_open') {
    sortPart = [ { $sort: { "opened": 1 } } ];
  } else if (sort == 'm_popular') {
    sortPart = [ { $sort: { "popular": -1 } } ];
  } else if (sort == 'l_popular') {
    sortPart = [ { $sort: { "popular": 1 } } ];
  } else if (sort == 'p_to_high') {
    sortPart = [ { $sort: { "original_price": 1 } } ];
  } else if (sort == 'p_to_low') {
    sortPart = [ { $sort: { "original_price": -1 } } ];
  } else if (sort == 'new') {
    sortPart = [ { $sort: { "created_at": -1 } } ];
  } else if (sort == 'old') {
    sortPart = [ { $sort: { "created_at": 1 } } ];
  }

  return sortPart;
}

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
      $addFields: { "icon": { $concat: [`${process.env.LINK}/`, "$icon_path"] } }
    }, {
      $sort: { "recommend": -1 }
    }, {
      $project: {
        _id: 0, ancestor_box: 1, code: 1, name: 1, cost: 1, original_price: 1,
        currency: 1, icon: 1, level_required: 1, order: 1, slug: 1,
        "tags.code": 1, "tags.name": 1, "tags.visible": 1, "tags.color": 1
      }
    },
    { $skip: (_page - 1) * _size },
    { $limit: _size }
  ]);

  return data;
}

module.exports = BoxController;