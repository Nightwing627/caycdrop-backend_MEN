const UserSchema = require('../model/UserSchema');
const PromoCodeSchema = require('../model/PromoCodeSchema');
const TierSchema = require('../model/TierSchema');
const AffliateTxsSchema = require('../model/AffliateTxsSchema');
const TxSchema = require('../model/TransactionSchema');
const WalletExchangeSchema = require('../model/WalletExchangeSchema');
const UserAffliateSchema = require('../model/UserAffliateSchema');
const OrderPromoSchema = require('../model/OrderPromoSchema');

const AffliateController = {
  setPromoCode: async (req, res) => {
    const { userCode, promoCode } = req.body;

    try {
      // validate params
      const user = await UserSchema.findOne({ code: userCode });
      if (user == null)
        return res.status(400).json({ error: 'Wrong user info' });
      if (!promoCode)
        return res.status(400).json({ error: 'Promo code must be filled' });
      
      let pCode = await PromoCodeSchema.findOne({ promo_code: promoCode });
      if (pCode)
        return res.status(400).json({ error: `${promoCode} is already used. Please use another code` });
      
      // handle promo code
      const promo = await PromoCodeSchema.find({ user_code: userCode });
      
      if (promo) {
        // user affiliate code existing
        const userAffliate = await UserAffliateSchema
          .findOne({ user_code: userCode })
          .populate('tier');
        
        if (promo.length >= userAffliate.tier.assignable) {
          return res.status(400).json({ error: 'Reached out the limitation of tiers ' });
        }
        
        pCode = await PromoCodeSchema.create({
          user_code: userCode,
          promo_code: promoCode
        });
        return res.status(200).json({ result: 'success' });
      } else {
        await PromoCodeSchema.create({
          user_code: userCode,
          promo_code: promoCode
        });
        return res.status(200).json({ result: 'success' });
      }
    } catch (error) {
      console.log('>> Set Promo code error: ', error);
      res.status(400).json({ error: 'Operation is failed' });
    }
  },

  getTiers: async (req, res) => {
    try {
      const data = await TierSchema
        .find()
        .sort({ commission: 1 })
        .select('-_id -__v');

      res.status(200).json({ data });
    } catch (error) {
      console.log('>> Get Tiers Error: ', error);
      res.status(400).json({ error: 'Fetching tiers is failed' });
    }
  },

  setOrder: async (req, res) => {
    const { userCode, promoCode } = req.body;

    try {
      // validate params
      const user = await UserSchema.findOne({ code: userCode });
      if (!user)
        return res.status(400).json({ error: 'Wrong user info' });
      if (!promoCode)
        return res.status(400).json({ error: 'Promo code must be filled' });
      
      // check promo code existing
      const pCode = await PromoCodeSchema.findOne({ promo_code: promoCode });
      if (!pCode)
        return res.status(400).json({ error: 'Could not found promo code' });
      // check user's own
      if (pCode.user_code == userCode)
        return res.status(400).json({ error: 'You cannot use your own promo code' });
      
      // check order existing
      const orders = await OrderPromoSchema.find({ user_code: userCode });
      if (orders.length > 0) {
        // remove all orders
        await OrderPromoSchema.remove({ user_code: userCode });
      }

      // create order to use the promo code
      await OrderPromoSchema.create({
        user_code: userCode,
        user_promo: pCode._id
      });
      
      const userAffliate = await UserAffliateSchema
        .findOne({ user_code: userCode }).populate('tier');
      
      return res.status(200).json({
        result: 'success',
        msg: `You’ll receive an extra 5% (Max $${userAffliate.tier.max_referal_amount_day}/day) of the total amount on your next deposit.`
      });
    } catch (error) {
      console.log('>> SetOrder error: ', error);
      res.status(400).json({ error: 'Operation is failed' });
    }
  }
}

module.exports = AffliateController;