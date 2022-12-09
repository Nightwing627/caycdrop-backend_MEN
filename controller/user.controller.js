const UserSchema = require('../model/UserSchema');
const AccountSchema = require('../model/AccountSchema');
const UserCartSchema = require('../model/UserCartSchema');
const UserDocumentSchema = require('../model/UserDocumentSchema');
const UserProgressSchema = require('../model/UserProgressSchema');
const UserSeedSchema = require('../model/UserSeedSchema');
const UserShippingInfoSchema = require('../model/UserShippingInfoSchema');
const UserTagSchema = require('../model/UserTagSchema');
const UserWalletSchema = require('../model/UserWalletSchema');
const CountrySchema = require('../model/CountrySchema');
const Util = require('../util');
const UserCryptoWalletSchema = require('../model/UserCryptoWalletSchema');
const Wallet = require('../walletManage');
const ExchangeRateSchema = require('../model/ExchangeRate');
const UserVerifySchema = require('../model/UserVerifySchema');
const BoxOpenSchema = require('../model/BoxOpenSchema');
const WalletExchangeSchema = require('../model/WalletExchangeSchema');
const BoxSchema = require('../model/BoxSchema');
const ItemSchema = require('../model/ItemSchema');
const SeedSchema = require('../model/SeedSchema');
const TxSchema = require('../model/TransactionSchema');

const util = require('util');
const path = require('path');
const multer = require('multer');
const uuid = require('uuid');


const UserController = {
  getCurrentUser: async (req, res) => {
    const { userCode } = req.body;
    
    try {
      const user = await Util.getUserByCode(userCode);
      
      if (user == null) {
        return res.status(400).json({ error: "user not found" });  
      }
      res.status(200).json({ data: user });
    } catch (error) {
      res.status(400).json({ error: "user not found" });
    }
  },

  changeUserBasic: async (req, res) => { 
    const { userCode, username, email } = req.body;

    try {
      if (!(username && email)) {
        return res.status(400).json({ error: "please send the user information" });
      }

      const user = await UserSchema.findOne({ code: userCode });
      if (user == null) {
        return res.status(400).json({ error: "user not found" });
      }
      const account = await AccountSchema.findOne({ user_code: userCode });
      account.username = username;
      await account.save();

      if (email != user.email) {
        const userVerify = await UserVerifySchema.create({
          user_code: userCode,
          token: Util.getRandomToken()
        });

        Util.sendEmail('emailChange', { userCode, token: userVerify.token });
      }

      res.status(200).json({ result: 'success', data: await Util.getUserByCode(userCode) });
    } catch (error) {
      res.status(400).json({ error: "user not found" })
    }
  },

  changeUserShipping: async (req, res) => {
    const { userCode, firstName, lastName, address1, address2,
      zipCode, state, city, country, phone } = req.body;

    if (!(firstName && lastName && address1 && zipCode && state && city && country && phone)) {
      return res.status(400).json({ error: "Please input all informations" });
    }

    try {
      const user = await UserSchema.findOne({ code: userCode });
      const shippingInfo = await UserShippingInfoSchema.findOne({ user_code: userCode });

      if (user == null || shippingInfo == null) {
        return res.status(400).json({ error: "wrong parameter" });
      }
      const countryItem = await CountrySchema.findOne({ code: country });

      shippingInfo.first_name = firstName;
      shippingInfo.last_name = lastName;
      shippingInfo.address = address1;
      shippingInfo.address2 = shippingInfo.address2 || address2;
      shippingInfo.zipcode = zipCode;
      shippingInfo.state = state;
      shippingInfo.city = city;
      shippingInfo.country = countryItem.id;
      shippingInfo.phone = phone;
      // shippingInfo.birthday =

      await shippingInfo.save();

      res.status(200).json({ result: 'success', data: await Util.getUserByCode(userCode) });
    } catch (error) {
      return res.status(400).json({ error: "wrong parameter" });
    }
  },

  getAllCountries: async (req, res) => {
    return res.status(200).json({ data: await CountrySchema.find() })
  },

  getCartFilters: (req, res) => {
    res.status(200).json({
      filters: [
        { label: 'Price High to Low', value: 'p-htl' },
        { label: 'Price Low to High', value: 'p-lth' },
        { label: 'Newest first', value: 'new' },
        { label: 'Oldest first', value: 'old' },
        { label: 'Recently updated first', value: 'ru' },
        { label: 'Oldest update first', value: 'ou' },
      ]
    })
  },

  getUserCart: async (req, res) => {
    const { userCode, query, sort } = req.body;

    try {
      const user = await UserSchema.findOne({ code: userCode });
      let sortField = { "item.value": -1 };
      if (sort != undefined) {
        if (sort == 'p-htl')
          sortField = { "item.value": -1 };
        else if (sort == 'p-lth')
          sortField = { "item.value": 1 };
        else if (sort == 'new')
          sortField = { "created_at": -1 };
        else if (sort == 'old')
          sortField = { "created_at": 1 };
        else if (sort == 'ru')
          sortField = { "updated_at": -1 };
        else if (sort == 'ou')
          sortField = { "created_at": 1 };
      }

      if (user == null) {
        return res.status(400).json({ error: "user not found" });
      }

      let search = query == undefined ? '' : query;

      const userCarts = await UserCartSchema.aggregate([
        {
          $lookup: {
            from: 'items',
            localField: 'item_code',
            foreignField: 'code',
            pipeline: [
              {
                $project: { _id: 0, __v: 0, created_at: 0, updated_at: 0, category: 0 }
              }
            ],
            as: 'item'
          }
        },
        {
          $unwind: { path: "$item" }
        },
        {
          $match: { user_code: userCode, "item.name": { $regex: `.*${search}.*` } }
        },
        {
          $sort: sortField
        },
        {
          $project: { _id: 0, user_code: 1, item: 1 }
        }
      ]);
      
      res.status(200).json({ data: userCarts });
    } catch (error) {
      res.status(400).json({ error: "cart item not found" });
    } 
  },

  sellUserItem: async (req, res) => {
    const { userCode, itemIds } = req.body;

    try {
      if (!Array.isArray(itemIds)) {
        return res.status(400).json({ error: 'item info must be array' });
      }

      const userCarts = await UserCartSchema.find({ code: { $in: itemIds } });
      if (userCarts == null) {
        return res.status(400).json({ error: "wrong user cart info" });
      }

      var isUserOwn = true;
      for (var uCart of userCarts) {
        if (uCart.user_code != userCode)
          isUserOwn = false;
      }

      if (!isUserOwn) {
        return res.status(400).json({ error: "this items is not for user" });
      }

      const user = await UserSchema.findOne({ code: userCode });
      
      for (var userCart of userCarts) {
        // get item info
        const item = await ItemSchema.findOne({ code: userCart.item_code })

        // change user walle amount
        const userWallet = await UserWalletSchema.findOne({ user_code: userCode });
        userWallet.main += Number(item.value);
        await userWallet.save();

        // log the exchange
        const walletExchange = await WalletExchangeSchema.create({
          user: user._id,
          type: process.env.WALLET_EXCHANGE_ITEM,
          value_change: Number(item.value),
          changed_after: userWallet.main,
          currency: 'USD',
          target: item._id
        });
        walletExchange.code = Util.generateCode('walletexchange', walletExchange._id);
        await walletExchange.save();

        // modify the boxOpen's user item
        const boxOpen = await BoxOpenSchema.findOne({ user: user._id, user_item: userCart._id })
        if (boxOpen != null) {
          boxOpen.user_item = null;
          await boxOpen.save();
        }
        // remove the user cart item
        await UserCartSchema.findByIdAndDelete(userCart._id);
      }

      res.status(200).json({ result: 'success' });
    } catch (error) {
      console.log(error);
      res.status(400).json({ error: 'item sell failed' });
    }
  },

  getUserCryptoWallet: async (req, res) => {
    const { userCode } = req.body;
    const data = await UserCryptoWalletSchema.findOne({ user_code: userCode });
    const rates = await ExchangeRateSchema.find();

    let txLimit = [];
    const depositMin = Number(process.env.DEPOSIT_MIN);
    const withrawMin = Number(process.env.WITHRAW_MIN);
    rates.forEach(rate => {

      var _dMin = Number((depositMin / rate.value).toFixed(4));
      var _wMin = Number((withrawMin / rate.value).toFixed(4));
      txLimit.push({ coin: rate.coinType, depositMin: _dMin, withrawMin: _wMin });
    });
    if (data == null)
      res.status(400).json({ error: 'wrong user code' });
    else
      res.status(200).json({ data: { ...data.toGetJSON(), txLimit } });
  },

  withrawItem: async (req, res) => {
    const { userCode, items, method, address } = req.body;

    // verify user info
    const user = await UserSchema.findOne({ code: userCode });
    if (user == null)
      return res.status(400).json({ error: 'wrong user info ' });
    
    // validate items
    if (!Array.isArray(items))
      return res.status(400).json({ error: 'wrong items formart' });
    if (items.length == 0)
      return res.status(200).json({ error: 'no item data' });

    // match the user info and items
    const cart = await UserCartSchema.find({ user_code: userCode });
    if (cart == null)
      return res.status(200).json({ error: 'no user cart data' });
    
    // get user cart items and calc the total amount
    const userCarts = await UserCartSchema.aggregate([
      {
        $match: { code: { $in: items }, user_code: userCode }
      },
      {
        $lookup: {
          from: 'items',
          localField: 'item_code',
          foreignField: 'code',
          as: 'item'
        }
      },
      { $unwind: { path: "$item" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$item.value" }
        }
      }
    ]).exec();
    
    // get exchange rate and calc the coin value
    const rate = await ExchangeRateSchema.findOne({ coinType: method });
    if (rate == null)
      return res.status(400).json({ error: `${method} is not supported` });
    
    if (userCarts[0].total < Number(process.env.WITHRAW_MIN))
      return res.status(400).json({ error: 'Withraw amount must be greater than Minimum' });
    
    const withrawAmount = Number((userCarts[0].total / rate.value).toFixed(4));  
  
    // withraw amount
    Wallet.withraw(withrawAmount, address, method)
      .then(async response => {
        console.log('Wallet Withraw Result:', response);
        if (response && response.hash) { 
          // success withraw & remove item user cart
          await UserCartSchema.deleteMany({ code: { $in: items }, user_code: userCode });
          // log txs
          const txData = await TxSchema.create({
            user_code: userCode,
            amount: withrawAmount,
            currency: method,
            exchange_rate: rate.value,
            exchanged_amount: Number((userCarts[0].total).toFixed(2)),
            method,
            status: 'completed',
            url: response.hash,
            promo_code: null,
            bonus_percent: 0,
            bonus_max_amount: 0,
            bouns_amount: 0,
            type: 'WITHRAW'
          });
          txData.code = Util.generateCode('transaction', txData._id);
          await txData.save();
          
          return res.status(200).json({ result: 'success' });
        } else {
          // fail withraw
          return res.status(400).json({ error: 'transaction failed' });
        }
      })
      .catch(error => {
        console.log('Wallet Withraw Error:', error);
        res.status(400).json({ error });
      });
  },

  getStatistic: async (req, res) => {
    const { userCode } = req.body;
    const { code } = req.params;

    try {
      let user;
      if (userCode != code) {
        user = await UserSchema.findOne({ code }).populate('account');
        if (user.account.is_hide_stats) {
          return res.status(200).json({ data: null });
        }
      } else {
        user = await UserSchema.findOne({ code: userCode }).populate('account');
      }
      
      if (user == null) {
        res.status(400).json({ error: 'user not found'});
      }

      // get total unboxed value
      const unboxedData = await BoxOpenSchema.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            totalValue: { $sum: "$cost" }
        }}
      ]);
      let unboxedValue = 0;
      if (unboxedData.length > 0) {
        unboxedValue = unboxedData[0].totalValue;
      }

      // get most favorite box - best opened
      const favoriteBoxInfo = await BoxOpenSchema.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: "$box",
            totalCount: { $sum: 1 }
          }
        },
        { $sort: { "totalCount": -1 } },
        { $limit: 1 }
      ]);
      let favoBox = null;
      if (favoriteBoxInfo.length > 0) {
        favoBox = await BoxSchema.findById(favoriteBoxInfo[0]._id);
        favoBox = favoBox.toGetOneJSON();
        favoBox.openTimes = favoriteBoxInfo[0].totalCount;
        delete favoBox.tags;
      }

      // get best unboxied item
      const itemId = await BoxOpenSchema.aggregate([
        { $match: { user: user._id } },
        {
          $lookup: {
            from: 'items',
            localField: 'item',
            foreignField: '_id',
            as: 'item'
          }
        },
        { $unwind: { path: "$item" } },
        { $sort: { "item.value": -1 } },
        { $limit: 1 }
      ]);
      
      let bestItem = null
      if (itemId.length > 0) {
        const box = await BoxSchema.findById(itemId[0].box);
        bestItem = {
          box: box.code,
          item: {
            code: itemId[0].item.code,
            name: itemId[0].item.name,
            iconUrl: itemId[0].item.icon_url,
            value: itemId[0].item.value,
            rarity: itemId[0].item.rarity
          }
        }
      }

      // get total items exchanged
      const totalExchangedData = await WalletExchangeSchema.aggregate([
        { $match: { user: user._id, type: process.env.WALLET_EXCHANGE_ITEM } },
        {
          $group: {
            _id: null,
            totalValue: { $sum: '$value_change' }
          }
        }
      ]);
      let totalExchanged = 0;
      if (totalExchangedData.length > 0) {
        totalExchanged = totalExchangedData[0].totalValue;
      }


      // get luckiest box - max total picked / open times
      const luckiestBox = await BoxOpenSchema.aggregate([
        { $match: { user: user._id } },
        {
          $lookup: {
            from: 'items',
            localField: 'item',
            foreignField: '_id',
            as: 'item'
          }
        },
        { $unwind: { path: "$item" } },
        {
          $group: {
            _id: "$box",
            totalSum: { $sum: "$item.value" },
            totalCount: { $sum: 1 }
        
          }
        },
        { $sort: { "totalCount": -1 } },
        { $set: { luckBox: { $divide: ["$totalSum", "$totalCount"] } } },
        { $sort: { "luckBox": -1 } },
        { $limit: 1 }
      ]);
      let luckBox = null;
      if (luckiestBox.length > 0) {
        luckBox = await BoxSchema.findById(luckiestBox[0]._id);
        luckBox = luckBox.toGetOneJSON();
        luckBox.openTimes = luckiestBox[0].totalCount;
        delete luckBox.tags;
      }

      res.status(200).json({
        data: {
          totalUnboxedValue: unboxedValue,
          mostFavoriteBox: favoBox,
          bestUnboxedItem: bestItem,
          totalItemExchanged: totalExchanged,
          luckiestBox: luckBox
      }})

    } catch (error) {
      console.log('User get statistic: ', error);
      res.status(400).json({ error: 'user not found'});
    }
  },

  saveDocument: async (req, res) => {
    const { userCode, type } = req.body;
    try {
      const user = await UserSchema.findOne({ code: userCode });
      if (user == null) {
        return res.status(400).json({ error: 'wrong user info' });
      }
      if (type != process.env.TYPE_IDENTITY || type != process.env.TYPE_RESIDENCE) {
        return res.status(400).json({ error: 'wrong type info' });
      }
      
      await uploadFFiles(req, res);
      
      if (req.files.length <= 0) {
        return res.status(400).json({ error: `You must select at least 1 file.`});
      }
      
      let fileNames = [];
      req.files.forEach(item => {
        fileNames.push(item.filename);
      })

      let document = await UserDocumentSchema.findOne({ user_code: userCode });
      if (document != null) {
        fileNames.forEach(name => {
          document.files.push(name);
        });
        await document.save();
      } else {
        await UserDocumentSchema.create({
          user_code: userCode,
          files: fileNames
        });
      }
      return res.status(200).json({ result: 'success' });
    } catch (error) {
      console.log(error);
      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ error: "Too many files to upload." });
      }
      return res.status(400).json({ error: `Error when trying upload many files: ${error}`});
    }
  },

  getUserSeed: async (req, res) => {
    const { userCode } = req.body;
    try {
      const user = await UserSchema.findOne({ code: userCode });
      if (user == null) {
        return res.status(400).json({ error: 'wrong user info' });
      }
      
      const seeds = await UserSeedSchema
        .findOne({ userId: user._id })
        .populate('client_seed')
        .populate('old_client_seed')
        .populate('server_seed')
        .populate('next_server_seed')
        .populate('old_server_seed')
        .exec();
      
      res.status(200).json({ data: seeds.toGetJSON() });
    } catch (error) {
      console.log(error);
      res.status(400).json({ error: 'wrong user info' })
    }
  },

  changeUserSeed: async (req, res) => {
    const { userCode, value } = req.body;
  
    try {
      const user = await UserSchema.findOne({ code: userCode });
      if (user == null) {
        return res.status(400).json({ error: 'wrong user info' });
      }
      if (value == '') {
        return res.status(400).json({ error: 'wrong client value' });
      }

      const userSeeds = await UserSeedSchema.findOne({ userId: user._id });

      // change current client seed and save old client seed
      let ccd = await SeedSchema.findById(userSeeds.client_seed);
      if (ccd) {
        let ocd = await SeedSchema.findById(userSeeds.old_client_seed);
        if (ocd) {
          ocd.value = ccd.value; ocd.hash = ccd.hash;
          await ocd.save();
        } else {
          ocd = await SeedSchema.create({
            type: process.env.SEED_TYPE_CLIENT,
            future: false, value: ccd.value, hash: ccd.hash
          });
          ocd.code = Util.generateCode('seed', ocd._id);
          await ocd.save();
          userSeeds.old_client_seed = ocd._id;
          await userSeeds.save();
        }

        ccd.value = value; ccd.hash = Util.getHashValue(value);
        await ccd.save();
      } else {
        ccd = await SeedSchema.create({
          type: process.env.SEED_TYPE_CLIENT,
          future: false, value: value, hash: Util.getHashValue(value)
        });
        ccd.code = Util.generateCode('seed', ccd._id);
        await ccd.save();
        userSeeds.client_seed = ccd._id;
        await userSeeds.save();
      }
      
      // change current, future, old server seed
      await changeServerSeed(user._id, userCode);

      res.status(200).json({ result: 'success' });
    } catch (error) {
      console.log(error);
      res.status(400).json({ error: 'wrong user info' })
    }
  },

  revalUserSeed: async (req, res) => {
    const { userCode } = req.body;
  
    try {
      const user = await UserSchema.findOne({ code: userCode });
      if (user == null) {
        return res.status(400).json({ error: 'wrong user info' });
      }
      
      // change current, future, old server seed
      await changeServerSeed(user._id, userCode);

      res.status(200).json({ result: 'success' });
    } catch (error) {
      console.log(error);
      res.status(400).json({ error: 'wrong user info' })
    }
  },

  getGameHistory: async (req, res) => {
    const { useCode, pvpId, createdMin, createdMax, sort, gameType, strategy } = req.body;


  },

  getUnboxingHistory: async (req, res) => {
    
  }
};

var storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, path.join(__dirname + '/../public/uploads/documents/'));
  },
  filename: (req, file, callback) => {
    // const match = ['image/png', 'image/jpge'];

    // if (match.indexOf(file.mimetype) === -1) {
    //   var message = `${file.originalname} is invalid. Only accept png/jpeg.`;
    //   return callback(message, null);
    // }
    var extArr = file.originalname.split('.');
    var extension = extArr[extArr.length - 1];

    var filename = `${Date.now()}_${uuid.v4()}.${extension}`;
    callback(null, filename);
  }
});

var upload = multer({ storage }).array('documents', 10);
var uploadFFiles = util.promisify(upload);

const changeServerSeed = async (userId, userCode) => {
  try {
    const userSeeds = await UserSeedSchema.findOne({ userId: userId });
    let nsd = await SeedSchema.findById(userSeeds.next_server_seed);
    let csd = await SeedSchema.findById(userSeeds.server_seed);
    let osd = await SeedSchema.findById(userSeeds.old_server_seed);

    const nsdValue = Util.getHashValue(`server_next_${userCode}_${Date.now}`);

    if (nsd) {
      osd.hash = csd.hash;
      osd.value = csd.value;
      await osd.save();

      csd.value = nsd.value;
      csd.hash = nsd.hash;
      await csd.save();

      nsd.value = nsdValue;
      nsd.hash = Util.getHashValue(nsdValue);
      await nsd.save();
    } else {
      const csdValue = Util.getHashValue(`server_${userCode}_${Date.now}`);
      
      nsd = await SeedSchema.create({
        type: process.env.SEED_TYPE_SERVER,
        future: true,
        value: nsdValue,
        hash: Util.getHashValue(nsdValue)
      });
      nsd.code = Util.generateCode('seed', nsd._id);
      await nsd.save();

      csd = await SeedSchema.create({
        type: process.env.SEED_TYPE_SERVER,
        future: false,
        value: csdValue,
        hash: Util.getHashValue(csdValue)
      });
      csd.code = Util.generateCode('seed', csd._id);
      await csd.save();
      
      osd = await SeedSchema.create({
        type: process.env.SEED_TYPE_SERVER,
        future: false,
      });
      osd.code = Util.generateCode('seed', osd._id);
      await osd.save();

      userSeeds.next_server_seed = nsd._id;
      userSeeds.server_seed = csd._id;
      userSeeds.old_server_seed = osd._id;
      await userSeeds.save();
    } 
  } catch (error) {
    console.log('Change Server Seed', error);
  }
}

module.exports = UserController;