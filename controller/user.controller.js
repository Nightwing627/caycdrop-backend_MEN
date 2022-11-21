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
      const user = getUserByCode(userCode);
      
      if (user == null) {
        return res.status(400).json({ error: "user not found" });  
      }
      res.status(200).json({ data: user.toAuthJSON() });
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

      res.status(200).json({ result: 'success', data: getUserByCode(userCode) });
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

      res.status(200).json({ result: 'success', data: getUserByCode(userCode) });
    } catch (error) {
      return res.status(400).json({ error: "wrong parameter" });
    }
  },

};

const getUserByCode = async (code) => {
  const user = await UserSchema
    .findOne({ code })
    .populate('account', '-_id -__v -user_code')
    .populate('user_progress', '-_id -__v -user_code -bet_count')
    .populate('wallets', '-_id -__v -user_code')
    .populate('shipping_info', '-_id -__v -user_code')
    .select('-__v');
  
  return user;
}

module.exports = UserController;