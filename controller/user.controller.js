const UserSchema = require('../model/UserSchema');
const AccountSchema = require('../model/AccountSchema');
const UserCartSchema = require('../model/UserCartSchema');
const UserDocumentSchema = require('../model/UserDocumentSchema');
const UserProgressSchema = require('../model/UserProgressSchema');
const UserSeedSchema = require('../model/UserSeedSchema');
const UserShippingInfoSchema = require('../model/UserShippingInfoSchema');
const UserTagSchema = require('../model/UserTagSchema');
const UserWalletSchema = require('../model/UserWalletSchema');

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
  }
};

module.exports = UserController;