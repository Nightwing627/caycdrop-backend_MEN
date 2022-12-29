const UserSchema = require('../model/UserSchema');
const PromoCodeSchema = require('../model/PromoCodeSchema');
const TierSchema = require('../model/TierSchema');
const AffliateTxsSchema = require('../model/AffliateTxsSchema');
const TxSchema = require('../model/TransactionSchema');
const WalletExchangeSchema = require('../model/WalletExchangeSchema');

const AffliateController = {
  setPromoCode: async (req, res) => {
    const { userCode, promoCode } = req.body;

    try {
      const user = await UserSchema.findOne({ code: userCode });
      if (user == null)
        return res.status(400).json({ error: 'wrong user info' });
      
      const promo = await PromoCodeSchema.find({ user_code: userCode });

      if (!promoCode) 
        return res.status(400).json({ error: 'promo code must be filled' });
      
      if (promo) {
        // user affiliate code existing
        
        // check user tier level
        
      } else {
        await PromoCodeSchema.create({
          user_code: userCode,
          promo_code: promoCode
        });
        return res.status(200).json({ result: 'success' });
      }
    } catch (error) {
      console.log('>> Set Promo code error: ', error);
      res.status(400).json({ error: 'operation is failed' });
    }
  }
}

module.exports = AffliateController;