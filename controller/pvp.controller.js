const mongoose = require('mongoose');
const UserSchema = require('../model/UserSchema');
const UserWallet = require('../model/UserWalletSchema');
const UserCartSchema = require('../model/UserCartSchema');
const UserProgress = require('../model/UserProgressSchema');

const BoxSchema = require('../model/BoxSchema');
const TagSchema = require('../model/TagSchema');

const PvpGameSchema = require('../model/PvpGameSchema');
const PvpGamePlayerSchema = require('../model/PvpGamePlayerSchema');
const PvpRoundSchema = require('../model/PvpRoundSchema');
const PvpRoundBetSchema = require('../model/PvpRoundBetSchema');

const util = require('../util');
const walletManage = require('../walletManage');
const UserWalletSchema = require('../model/UserWalletSchema');
const WalletExchangeSchema = require('../model/WalletExchangeSchema');
const SeedSchema = require('../model/SeedSchema');
const RollHistorySchema = require('../model/RollHistorySchema');
const BoxItemSchema = require('../model/BoxItemSchema');

const filterPrices = [
  { value: '', label: 'All Prices' },
  { value: 'tight', label: '0.01 - 10' },
  { value: 'normal', label: '10 - 50' },
  { value: 'more', label: '50 - 100' },
  { value: 'high', label: '100+' }
];

const filterOrders = [
  { value: 'recommend', label: 'Recommended' },
  { value: 'm_open', label: 'Most Opened Boxes' }, // sort box opening count
  { value: 'l_open', label: 'Leaset Opened Boxes' },
  { value: 'm_popular', label: 'Most Popular' },   // sort box setted in battle
  { value: 'l_popular', label: 'Least Popular' },
  { value: 'p_to_high', label: 'Price(Low to High)' },
  { value: 'p_to_low', label: 'Price(High to low)' },
  { value: 'new', label: 'Newest' },
  { value: 'old', label: 'Oldest' }
];

const PVPController = {
  getFilters: async (req, res) => {
    const tags = await TagSchema
      .find({ visible: true })
      .select({ _id: 0, __v: 0 });

    res.status(200).json({ tags, filterPrices, filterOrders });
  },

  getBoxList: async (req, res) => {
    const { _q, _sort, _tag, _price } = req.body;

    const search = _q ? _q : '';
    const sort = _sort ? _sort : 'recommend';

    try {
      // Set match realation and sort field
      let conditions;
      let nameMatch, priceMatch, tagMatch, aggreSort;

      nameMatch = { name: { $regex: '.*' + search + '.*', $options: 'i' } };
      priceMatch = getPriceMatch(_price);
      tagMatch = await getTagMatch(_tag);
      aggreSort = getSortField(sort);

      let matchPart = nameMatch;

      if (priceMatch) {
        matchPart = { $and: [nameMatch, priceMatch] };
      }
      conditions = matchPart;

      if (tagMatch && tagMatch.or) {
        matchPart = { $or: [matchPart, tagMatch.filter] };
      } else if (tagMatch && !tagMatch.or) {
        if (matchPart.$and) {
          matchPart.$and.push(tagMatch.filter);
        } else {
          matchPart.$and =  tagMatch.filter;
        }
      }
      conditions = matchPart;

      const data = await BoxSchema.aggregate([
        { $match: conditions },
        { 
          $lookup: {
            from: 'tags',
            localField: 'tags',
            foreignField: '_id',
            as: "tags"
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
      ]);

      res.status(200).json({ data });
    } catch (error) {
      res.status(200).json({ data: [] });
    }
  },

  createBattle: async (req, res) => {
    const { userCode, isPrivate, botEnable, strategy, boxData } = req.body;
    
    try {
      // validate params
      if (!(userCode && isPrivate != null && botEnable != null && strategy && boxData))
        return res.status(400).json({ error: 'params is wrong' });
      
      if (!Array.isArray(boxData))
        return res.status(400).json({ error: 'box list\'s format is wrong ' });  
      
      const user = await UserSchema
        .findOne({ code: userCode })
        .populate('wallets')
        .populate('user_progress')
        .populate('account');
      
      // get total bet price
      let totalBet = 0;
      let betedBoxList = [];
      for (var index in boxData) {
        const item = boxData[index];

        const box = await BoxSchema.findOne({ code: item.box });
        for (let i = 0; i < item.count; i++) { 
          betedBoxList.push(box);
        }
        totalBet += box.cost * Number(item.count);
      }
      
      // check the user ballance
      if (totalBet == 0 || totalBet > user.wallets.main)
        return res.status(400).json({ error: 'tight budget' });
      
      // order boxlist by price
      betedBoxList.sort((a, b) => { return a.cost - b.cost });

      // create battle
      const pvpGame = await PvpGameSchema.create({
        is_private: isPrivate,
        bot_enable: botEnable,
        strategy: strategy == 'crazy' ? process.env.PVP_STRATEGY_MIN : process.env.PVP_STRATEGY_MAX,
        rounds: betedBoxList.length,
        current_round: 0,
        total_bet: Number(totalBet.toFixed(2)),
        winner: null,
        status: process.env.PVP_GAME_CREATED,
        total_payout: 0,
        box_list: betedBoxList,
        finished_at: null
      });
      const pvpGameCode = util.generateCode('pvpgame', pvpGame._id);
      await PvpGameSchema.findByIdAndUpdate(pvpGame._id, {
        code: pvpGameCode
      });

      const rollData = await getPvpRoll(pvpGameCode);
      await PvpGameSchema.findByIdAndUpdate(pvpGame._id, {
        roll: rollData
      });

      // create battle player
      const creatorInfo = {
        code: userCode,
        name: user.account.username,
        avatar: user.account.avatar,
        rank: user.account.g_rank,
        xp: parseInt(user.user_progress.xp),
        required_xp: user.user_progress.required_xp,
        next_required_xp: user.user_progress.next_required_xp,
        level: user.user_progress.level
      };
      const pvpGamePlayer = new PvpGamePlayerSchema({
        pvpId: pvpGame._id,
        creator: creatorInfo,
        joiner: null
      });
      await pvpGamePlayer.save();

      // create battle rounds and round bets - creator
      for (var i = 0; i < betedBoxList.length; i++) {
        let roundBet = await PvpRoundBetSchema.create({
          player: userCode,
          bet: betedBoxList[i].cost,
          item: null,
          currency: betedBoxList[i].currency,
          payout: 0,
          rewarded_xp: 0,
        });

        let pvpRound = await PvpRoundSchema.create({
          pvpId: pvpGame._id,
          round_number: (i + 1),
          box: betedBoxList[i]._id,
          bet: betedBoxList[i].cost,
          currency: betedBoxList[i].currency,
          creator_bet: roundBet._id,
          joiner_bet: null,
        });
        await PvpRoundSchema.findByIdAndUpdate(pvpRound._id, {
          code: util.generateCode('pvpround', pvpRound._id)
        });
      }

      // change user wallet
      const changedAfter = Number((user.wallets.main - Number(totalBet)).toFixed(2));
      await UserWalletSchema.findByIdAndUpdate(user.wallets._id, {
        main: changedAfter
      });

      // log wallet exchanges
      const walletExchange = await WalletExchangeSchema.create({
        user: user._id,
        type: process.env.WALLET_EXCHANGE_PVP,
        value_change: Number(totalBet.toFixed(2)),
        changed_after: changedAfter,
        wallet: user.wallets._id,
        currency: 'USD',
        target: pvpGame._id
      });
      await WalletExchangeSchema.findByIdAndUpdate(walletExchange._id, {
        code: util.generateCode('walletexchange', walletExchange._id)
      });

      res.status('200').json({ data: pvpGameCode });
    } catch (error) {
      console.log(error)
      res.status('400').json({ error: 'created failed' });
    }
  },

  getBattleByCode: async (req, res) => {
    const { userCode } = req.body;
    const { pvpId } = req.params;
    console.log(req.params)
    console.log(req.query);
    try {
      const pvpGame = await PvpGameSchema.findOne({ code: pvpId });
      if (pvpGame == null)
        return res.status(400).json({ error: 'wrong battle info' });
      
      const players = await PvpGamePlayerSchema.findOne(
        { pvpId: pvpGame._id }, { _id: 0, __v: 0, pvpId: 0 });
      const rounds = await PvpRoundSchema
        .find({ pvpId: pvpGame._id })
        .populate('creator_bet', '-_id -__v')
        .populate('joiner_bet', '-_id -__v')
        .populate('box', '-_id code name cost currency icon_path slug')
        .select('-_id -__v -pvpId');
      
      const responseData = {
        ...pvpGame.toGameJSON(),
        players,
        rounds
      }
      
      res.status(200).json({ data: responseData });
    } catch (error) {
      console.log(`Get Battle By Code Error: ${error}`);
      res.status(400).json({ error: 'wrong battle info' });
    }
  },

  getBattleSeedByCode: async (req, res) => {
    const { pvpId } = req.params;
    
    try {
      const pvpGame = await PvpGameSchema.findOne({ code: pvpId });
      if (pvpGame == null)
        return res.status(400).json({ error: 'wrong pvp id' });
      
      const rollHis = await RollHistorySchema.findById(pvpGame.roll);      
      if (rollHis == null)
        return res.status(400).json({ error: 'wrong pvp id' });
      console.log(req.params);
      const serverSeed = (await SeedSchema.findById(rollHis.server_seed)).toGameJSON();
      const clientSeed = (await SeedSchema.findById(rollHis.client_seed)).toGameJSON();
      
      const creatorNonce = rollHis.nonce;
      const joinerNonce = rollHis.nonce + pvpGame.rounds;

      const rounds = await PvpRoundSchema
        .find({ pvpId: pvpGame._id })
        .populate('box', '-_id code name icon_path');
      
      var roundData = [];
      rounds.forEach((item, index) => {
        console.log('@@@@@@@@@', pvpGame)
        const creatorRoll = item.round_number < pvpGame.current_round
          ? util.Seed.getRoll(
              process.env.GAME_PVP,
              clientSeed.hash,
              serverSeed.value,
              creatorNonce + index
          ) : null;
        const joinerRoll = item.round_number < pvpGame.current_round
          ? util.Seed.getRoll(
              process.env.GAME_PVP,
              clientSeed.hash,
              serverSeed.value,
              joinerNonce + index
          ) : null;
        
        const itemJSON = {
          code: item.code,
          round_number: item.round_number,
          box: item.box,
          bet: item.bet,
          currency: item.currency,
          started_at: item.started_at,
          finished_at: item.finished_at
        }
        roundData.push({
          ...itemJSON,
          creatorRoll: {
            nonce: creatorNonce + index,
            rollValue: creatorRoll,
          },
          joinerRoll: {
            nonce: joinerNonce + index,
            rollValue: joinerRoll,
          }
        });
      });

      var data = {
        clientSeed,
        serverSeed,
        rounds: roundData
      };
      if (pvpGame.status != process.env.PVP_GAME_COMPLETED) {
        data.serverSeed.value = null;
      }
      
      res.status(200).json({ data });
    } catch (error) {
      console.log(error);
      res.status(400).json({ error: 'wrong pvp id'})
    }
  },

  getBoxItems: async (req, res) => {
    const { code } = req.params;

    try {
      const box = await BoxSchema.findOne({ code });
      if (box == null)
        return res.status(400).send({ error: 'wrong box code' });
      
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
            as: 'item',
            pipeline: [
              {
                $project: {
                  _id: 0, __v: 0, category: 0, market: 0
              }}
            ]
          },
        },
        { $unwind: { path: "$item" } },
        {
          $sort: { "item.value": -1 }
        }
      ]);
  
      boxItems = util.setBoxItemRolls(boxItems);
      res.status(200).json({
        data: {
          code: box.code,
          name: box.name,
          slots: boxItems
        }
      });
    } catch (error) {
      console.log(error);
    }
  }
};

const getPriceMatch = (value) => {
  if (value == '')
    return null;
  
  if (value == 'tight') { 
    return { cost: { $gte: 0.01, $lt: 10 } };
  } else if (value == 'normal') {
    return { cost: { $gte: 10, $lt: 50 } };
  } else if (value == 'more') {
    return { cost: { $gte: 50, $lt: 100 } };
  } else if (value == 'high') {
    return { cost: { $gte: 100 } };
  }
}

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

const getPvpRoll = async (pvpCode) => {
  // set the seed values - server, client(block id), nonce
  // get server value, client hashed, nonce
  const serverValue = util.getHashValue('server_' + pvpCode);
  const serverHashed = util.getCryptoValue(serverValue);
  const blockInfo = await walletManage.getBlockInfo();
  const client = blockInfo.hash.slice(2, blockInfo.hash.length);

  const pvpClientSeed = await SeedSchema.create({
    type: process.env.SEED_TYPE_CLIENT,
    future: false,
    value: client,
    hash: client
  });
  await SeedSchema.findByIdAndUpdate(pvpClientSeed._id, {
    code: util.generateCode('seed', pvpClientSeed._id)
  });

  const pvpServerSeed = await SeedSchema.create({
    type: process.env.SEED_TYPE_SERVER,
    future: false,
    value: serverValue,
    hash: serverHashed
  });
  await SeedSchema.findByIdAndUpdate(pvpServerSeed._id, {
    code: util.generateCode('seed', pvpServerSeed._id)
  });

  const rollHistory = await RollHistorySchema.create({
    value: null,
    nonce: util.getNonce(blockInfo.number),
    game: process.env.GAME_PVP,
    server_seed: pvpServerSeed._id,
    client_seed: pvpClientSeed._id
  });
  
  await RollHistorySchema.findByIdAndUpdate(rollHistory._id, {
    code: util.generateCode('rollhistory', rollHistory._id)
  });

  return rollHistory._id;
}

module.exports = PVPController;