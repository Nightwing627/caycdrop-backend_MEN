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

const UserController = {
  getUserSeed: async (req, res) => {
    let data;
    const userCode = req.params.code;

    const user = await UserSchema.findOne({ code: userCode });
    const seeds = await UserSeedSchema
      .findOne({ userId: user._id })
      .populate('client_seed', '-_id -__v')
      .populate('old_client_seed', '-_id -__v')
      .populate('server_seed', '-_id -__v')
      .populate('next_server_seed', '-_id -__v')
      .populate('old_server_seed', '-_id -__v')
      .exec();
    
    res.status(200).json({ data });
  },

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
        // send verification to original email

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

  getUserCart: async (req, res) => {
    const { userCode } = req.body;

    try {
      const user = await UserSchema.findOne({ code: userCode });

      if (user == null) {
        return res.status(400).json({ error: "user not found" });
      }
      const userCarts = await UserCartSchema.aggregate([
        {
          $match: { user_code: userCode }
        },
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
          $unwind: "$item"
        },
        {
          $project: { _id: 0, user_code: 1, item: 1, }
        },
        {
          $sort: { "item.value": 1 }
        }
      ]);
      
      res.status(200).json({ data: userCarts });
    } catch (error) {
      res.status(400).json({ error: "cart item not found" });
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
    console.log(userCarts[0]);
    // get exchange rate and calc the coin value
    const rate = await ExchangeRateSchema.findOne({ coinType: method });
    if (rate == null)
      return res.status(400).json({ error: `${method} is not supported` });
    
    if (userCarts[0].total < Number(process.env.WITHRAW_MIN))
      return res.status(400).json({ error: 'Withraw amount must be greater than Minimum' });
    
    const withrawAmount = Number((userCarts[0].total / rate.value).toFixed(4));  
  
    // withraw amount
    Wallet.withraw(withrawAmount, address, method)
      .then(response => {
        // remove item user cart
        console.log(response);
      })
      .catch(error => {
      
      });
  }
};


module.exports = UserController;